import initSwc, { transformSync } from '@swc/wasm-web'
import { fromCallback, createActor } from 'xstate'

import { RenderInputEvent } from './'
import { javascriptAssemblyRenderer } from './javascript'

export const typescriptAssemblyRenderer = fromCallback<RenderInputEvent>(
  ({ sendBack, receive }) => {
    console.log('invoke ts')

    const actor = createActor(javascriptAssemblyRenderer)
    actor.start()

    const swcInitialized = initSwc()

    receive((event) => {
      console.log('handle ts')
      handleCode(event.code)
    })

    actor.on('renderer.success', sendBack)
    actor.on('renderer.failure', sendBack)

    return () => {
      console.log('cleanup ts')
      actor.stop()
    }

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

      actor.send({
        type: 'render',
        code: tsTransformOutput.code,
      })
    }
  },
)
