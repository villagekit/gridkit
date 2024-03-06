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
import debounceify from 'debounceify'

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

    const hasLoadedEvaluator = new Promise((resolve) => {
      evaluatorIframe.onload = resolve
    })

    receive((event) => {
      handleCode(event.code)
    })

    return () => {
      document.body.removeChild(evaluatorIframe)
    }

    async function handleCode(jsCode: string) {
      await hasLoadedEvaluator

      const evaluatorRaw = Comlink.wrap<AssemblyEvaluator>(
        Comlink.windowEndpoint(evaluatorIframe.contentWindow!),
      )
      const evaluator: AssemblyEvaluator = {
        evaluateModule: debounceify((code) => evaluatorRaw.evaluateModule(code)),
        evaluateAssembly: debounceify((parameters, partVariants) =>
          evaluatorRaw.evaluateAssembly(parameters, partVariants),
        ),
      }

      let jsModule
      try {
        jsModule = await evaluator.evaluateModule(jsCode)
        console.log('module', jsModule)
      } catch (error) {
        sendBack({
          type: 'renderer.failure',
          renderError: { type: 'javascript.evaluate', error },
        })
        return
      }

      if (jsModule == null) return
      const { meta, parameters, presets, assembly } = jsModule

      sendBack({
        type: 'renderer.success',
        render: {
          type: 'assembly' as const,
          meta,
          parameters,
          presets,
          assembly:
            assembly == null
              ? async (
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
                }
              : async () => assembly,
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
      assembly: typeof assembly === 'function' ? null : assembly
    }
  }

  function evaluateAssembly(parameters, partVariants) {
    return mod.assembly(parameters, partVariants)
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
