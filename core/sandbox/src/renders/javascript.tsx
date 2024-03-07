import { fromCallback } from 'xstate'
import { RenderInputEvent } from './'
import * as Comlink from 'comlink'
import { comlinkDataUrl } from '../comlink'
import {
  DesignMeta,
  DesignParameters,
  DesignParts,
  DesignPresets,
  DesignParametersValues,
  DesignPartVariantsByType,
} from '@villagekit/design'

type AssemblyEvaluator = {
  evaluateModule: (code: string) => Promise<{
    meta: DesignMeta
    parameters: DesignParameters | null
    presets: DesignPresets<any> | null
    assembly: DesignParts | null
  }>
  evaluateAssembly: (
    parameters: DesignParametersValues,
    partVariants: DesignPartVariantsByType,
  ) => Promise<DesignParts>
}

export const javascriptAssemblyRenderer = fromCallback<RenderInputEvent>(
  ({ sendBack, receive }) => {
    const evaluatorIframe = createEvaulatorIframe()
    document.body.appendChild(evaluatorIframe)

    const evaluator = Comlink.wrap<AssemblyEvaluator>(
      Comlink.windowEndpoint(evaluatorIframe.contentWindow!),
    )
    const hasLoadedEvaluator = new Promise((resolve) => {
      evaluatorIframe.onload = resolve
    })

    receive((event) => {
      handleCode(event.code)
    })

    return () => {
      evaluator[Comlink.releaseProxy]()
      document.body.removeChild(evaluatorIframe)
    }

    async function handleCode(jsCode: string) {
      await hasLoadedEvaluator

      let jsModule
      try {
        jsModule = await evaluator.evaluateModule(jsCode)
      } catch (error) {
        sendBack({
          type: 'renderer.failure',
          renderError: { type: 'javascript.evaluate', error },
        })
        return
      }

      if (jsModule == null) return

      const { meta, parameters, presets } = jsModule

      sendBack({
        type: 'renderer.success',
        render: {
          type: 'assembly' as const,
          meta,
          parameters,
          presets,
          assembly: async (
            parameters: DesignParametersValues,
            partVariants: DesignPartVariantsByType,
          ) => {
            try {
              return await evaluator.evaluateAssembly(parameters, partVariants)
            } catch (error) {
              console.error(error)
              sendBack({
                type: 'renderer.failure',
                renderError: { type: 'javascript.evaluate', error },
              })
              return []
            }
          },
        },
      })
    }
  },
)

const createEvaulatorIframe = () => {
  const iframe = document.createElement('iframe')
  iframe.title = 'Village Kit Evaluator'
  iframe.sandbox.add('allow-scripts')
  iframe.sandbox.add('allow-same-origin')
  iframe.style.display = 'none'
  iframe.srcdoc = createEvaluatorIframeSrc()
  return iframe
}

const createEvaulatorWorkerSrc = () => `
  // web workers don't yet support importmaps
  import * as Comlink from "${comlinkDataUrl}"

  let mod = null

  async function evaluateModule(code) {
    const modUrl = URL.createObjectURL(
      new Blob([code], { type: 'text/javascript' }),
    )
    try {
      mod = await import(modUrl)
    } finally {
      URL.revokeObjectURL(modUrl)
    }

    const { meta, parameters, presets, assembly } = mod

    return {
      meta,
      parameters,
      presets,
    }
  }

  function evaluateAssembly(parameters, partVariants) {
    return typeof mod.assembly === 'function'
      ? mod.assembly(parameters, partVariants)
      : mod.assembly
  }

  const exports = {
    evaluateModule,
    evaluateAssembly,
  }

  Comlink.expose(exports)
`

const createEvaluatorIframeSrc = () =>
  `
<!doctype html>
<script type="importmap">
{
  "imports": {
    "comlink": "${comlinkDataUrl}",
    "@villagekit/design": "data:,${encodeURI('')}"
  }
}
</script>
<script type="module">
  import * as Comlink from "comlink"

  const workerCode = \`${createEvaulatorWorkerSrc()}\`
  const workerUrl = URL.createObjectURL(
    new Blob([workerCode], { type: 'text/javascript' })
  )
  const workerObj = new Worker(workerUrl, { type: 'module' })
  const worker = Comlink.wrap(workerObj)

  Comlink.expose(worker, Comlink.windowEndpoint(self.parent))
</script>
</html>
`
