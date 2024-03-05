import initSwc, { transformSync } from '@swc/wasm-web'
import { fromCallback, ActorRefFrom } from 'xstate'

import { RenderInputEvent } from './'
import { javascriptAssemblyRenderer } from './javascript'

export const typescriptAssemblyRenderer = fromCallback<
  RenderInputEvent,
  { javascriptAssemblyRenderer: ActorRefFrom<typeof javascriptAssemblyRenderer> }
>(({ input, sendBack, receive }) => {
  const { javascriptAssemblyRenderer } = input

  const swcInitialized = initSwc()

  receive((event) => {
    handleCode(event.code)
  })

  return () => {}

  async function handleCode(tsCode: string) {
    await swcInitialized

    let tsTransformOutput
    try {
      tsTransformOutput = transformSync(tsCode, {
        jsc: {
          parser: {
            syntax: 'typescript',
          },
        },
        module: {
          type: 'es6',
          strict: true,
          noInterop: true,
        },
      })
    } catch (error) {
      if (error instanceof Error || typeof error === 'string') {
        console.error('swc', error)
        sendBack({
          type: 'renderer.failure',
          error,
        })
        return
      } else {
        throw error
      }
    }

    javascriptAssemblyRenderer.send({
      type: 'render',
      code: tsTransformOutput.code,
    })
  }
})
