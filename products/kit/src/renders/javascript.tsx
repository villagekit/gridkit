import { AnyMap, type TraceMap, originalPositionFor } from '@jridgewell/trace-mapping'
import * as Comlink from 'comlink'
import { parseStackTrace } from 'errorstacks'
import { fromCallback } from 'xstate'
import type { Params, ParamsValues, PartVariantsByType, Parts, Presets } from '../types'
import type { RenderEvent, RendererMachineEvent } from './'

type Evaluator = {
  loadModule: (code: string) => Promise<string>
  evaluateModule: () => Promise<{
    parameters: Params | null
    presets: Presets<any> | null
    parts: Parts | null
    plugins: Array<string> | undefined
  }>
  evaluateParts: (paramsValues: ParamsValues, partVariants: PartVariantsByType) => Promise<Parts>
}

export const javascriptRenderer = fromCallback<RenderEvent, RendererMachineEvent>(
  ({ sendBack, receive }) => {
    const loadEvaluator: Promise<[Comlink.Remote<Evaluator>, HTMLIFrameElement]> = new Promise(
      (resolve) => {
        ;(async () => {
          const evaluatorIframe = await createEvaulatorIframe()
          document.body.appendChild(evaluatorIframe)

          const evaluator = Comlink.wrap<Evaluator>(
            Comlink.windowEndpoint(evaluatorIframe.contentWindow!),
          )
          evaluatorIframe.onload = () => resolve([evaluator, evaluatorIframe])
        })()
      },
    )

    receive((event) => {
      handleCode(event.code)
    })

    return () => {
      ;(async () => {
        const [evaluator, evaluatorIframe] = await loadEvaluator

        evaluator![Comlink.releaseProxy]()
        document.body.removeChild(evaluatorIframe!)
      })()
    }

    async function handleCode(jsCode: string) {
      const [evaluator] = await loadEvaluator

      const traceMap = getTraceMap(jsCode)

      const moduleUrl = await evaluator.loadModule(jsCode)

      let jsModule: Awaited<ReturnType<Evaluator['evaluateModule']>>
      try {
        jsModule = await evaluator.evaluateModule()
      } catch (error) {
        sendEvaluationError(error)
        return
      }

      if (jsModule == null) return

      const { parameters, presets, parts, plugins } = jsModule

      const event: RendererMachineEvent =
        parameters == null || presets == null
          ? {
              type: 'renderer.success',
              render: {
                type: 'static',
                parts: parts != null ? parts : [],
                plugins,
              },
            }
          : {
              type: 'renderer.success',
              render: {
                type: 'parametric',
                parameters,
                presets,
                parts: async (paramsValues: ParamsValues, partVariants: PartVariantsByType) => {
                  try {
                    return await evaluator.evaluateParts(paramsValues, partVariants)
                  } catch (error) {
                    sendEvaluationError(error)
                    return []
                  }
                },
                plugins,
              },
            }
      sendBack(event)

      function sendEvaluationError(error: unknown) {
        console.error('error', error)
        const tracedError =
          error instanceof Error
            ? traceError(error, moduleUrl, traceMap)
            : { message: String(error), stack: [] }
        const event: RendererMachineEvent = {
          type: 'renderer.failure',
          renderError: {
            type: 'error:stack',
            title: 'JavaScript evaluation',
            ...tracedError,
          },
        }
        sendBack(event)
      }
    }
  },
)

const createEvaulatorIframe = async () => {
  const iframe = document.createElement('iframe')
  iframe.title = 'Village Kit Evaluator'
  iframe.sandbox.add('allow-scripts')
  iframe.sandbox.add('allow-same-origin')
  iframe.style.display = 'none'
  iframe.srcdoc = await createEvaluatorIframeSrc()
  return iframe
}

const loadImport = (code: string) =>
  URL.createObjectURL(new Blob([code], { type: 'text/javascript' }))

const loadImports = Promise.all([
  // @ts-ignore
  import('../../../../node_modules/comlink/dist/esm/comlink.js?raw'),
  // @ts-ignore
  import('../../../../node_modules/three/build/three.module.js?raw'),
  // @ts-ignore
  import('../../../../util/math/dist/index.js?raw'),
  // @ts-ignore
  import('../../../../util/units/dist/index.js?raw'),
  // @ts-ignore
  import('../../../../core/part/dist/creator.js?raw'),
  // @ts-ignore
  import('../../../../parts/gridbeam/dist-bundles/creator.js?raw'),
  // @ts-ignore
  import('../../../../parts/gridpanel/dist-bundles/creator.js?raw'),
  // @ts-ignore
  import('../../../../parts/fastener/dist-bundles/creator.js?raw'),
]).then((modules) => {
  const loaded = modules.map((module: any) => module.default).map(loadImport)
  const [comlink, three, math, units, partBase, partGridbeam, partGridpanel, partFastener] = loaded
  return {
    comlink: comlink,
    three: three,
    '@villagekit/math': math,
    '@villagekit/units': units,
    '@villagekit/part/creator': partBase,
    '@villagekit/part-gridbeam/creator': partGridbeam,
    '@villagekit/part-gridpanel/creator': partGridpanel,
    '@villagekit/part-fastener/creator': partFastener,
    '@villagekit/design/kit': loadImport(''),
  }
})

const createEvaluatorIframeSrc = async () => {
  const imports = await loadImports

  return `
<!doctype html>
<script type="importmap">
${JSON.stringify({ imports })}
</script>
<script type="module">
  import * as Comlink from "comlink"

  let moduleUrl = null
  let module = null

  function loadModule(code) {
    if (moduleUrl != null) {
      URL.revokeObjectURL(moduleUrl)
    }

    moduleUrl = URL.createObjectURL(
      new Blob([code], { type: 'text/javascript' }),
    )

    return moduleUrl
  }

  async function evaluateModule() {
    module = await import(moduleUrl)

    const { parameters, presets, parts, plugins } = module

    if (typeof parts === 'function') {
      return { parameters, presets, plugins }
    } else {
      return { parts, plugins }
    }
  }

  function evaluateParts(parameters, partVariants) {
    return module.parts(parameters, partVariants)
  }

  const exports = {
    loadModule,
    evaluateModule,
    evaluateParts,
  }

  Comlink.expose(exports, Comlink.windowEndpoint(self.parent))
</script>
</html>
`
}

function getTraceMap(code: string) {
  const sourceMapLine = code.substring(code.lastIndexOf('\n', code.length - 1) + 1, code.length)
  const sourceMapData = sourceMapLine.substring(sourceMapLine.indexOf(',') + 1)
  const sourceMapContent = atob(sourceMapData)
  const traceMap = new AnyMap(sourceMapContent)
  return traceMap
}

function traceError(error: Error, moduleUrl: string, traceMap: TraceMap) {
  const message = error.message

  if (error.stack == null) {
    return { message, stack: [] }
  }

  let stack = parseStackTrace(error.stack)

  const lastStackIndex = stack.findIndex((frame) => frame.fileName === moduleUrl)
  if (lastStackIndex !== -1) {
    stack = stack.slice(0, lastStackIndex + 1)
  }

  const tracedStack = stack.map((frame) => {
    const { name, line, column } = frame
    const originalPosition = originalPositionFor(traceMap, { line, column })
    return {
      name,
      line: originalPosition.line || line,
      column: originalPosition.column || column,
    }
  })

  return {
    message,
    stack: tracedStack,
  }
}
