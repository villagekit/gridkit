import { fromCallback } from 'xstate'
import { RenderInputEvent } from './'
import * as Comlink from 'comlink'

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
      const evaluator = Comlink.wrap(Comlink.windowEndpoint(evaluatorIframe.contentWindow!))

      let jsModule
      try {
        // @ts-ignore
        jsModule = await evaluator.evaluateModule(jsCode)
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
              ? async (...args: Array<any>) => {
                  try {
                    // @ts-ignore
                    return await evaluator.evaluateMethod('assembly', args)
                  } catch (error) {
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
  iframe.style.display = 'none'
  iframe.srcdoc = createEvaluatorDoc()
  return iframe
}

const createEvaluatorDoc = () =>
  `
<!doctype html>
<script type="importmap">
{
  "imports": {
    "@villagekit/design": "./villagekit-design.js"
  }
}
</script>
<script type="module" src="./villagekit-design.js"></script>
<script type="module">
  import * as Comlink from "https://unpkg.com/comlink@4.4.1/dist/esm/comlink.mjs";

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

    let result = {}
    for (const key in mod) {
      const value = mod[key]
      if (typeof value === 'function') continue
      result[key] = value
    }
    return result
  }

  function evaluateMethod(method, args) {
    return mod[method](...args)
  }

  const exports = {
    evaluateModule,
    evaluateMethod,
  }

  Comlink.expose(exports, Comlink.windowEndpoint(self.parent))
</script>
</html>
`
