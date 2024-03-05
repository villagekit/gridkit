import { fromCallback } from 'xstate'
import { RenderInputEvent } from './'
import { designAssemblySafeParse } from '@villagekit/design'

export const javascriptAssemblyRenderer = fromCallback<RenderInputEvent>(
  ({ sendBack, receive }) => {
    receive((event) => {
      handleCode(event.code)
    })

    return () => {}

    async function handleCode(jsCode: string) {
      const jsCodeWithoutImports = jsCode.replace(
        /import (.*) from [\"\']@villagekit\/design[\"\']/,
        'const $1 = villagekit.design',
      )
      const jsModuleCode = `
        "use strict";

        const villagekit = {
          design: {
            DesignAssemblyParameterized: (design) => ({ type: 'parameterized', ...design })
          }
        }

        ${jsCodeWithoutImports}
      `

      let jsModule
      try {
        const jsModuleUrl = URL.createObjectURL(
          new Blob([jsModuleCode], { type: 'text/javascript' }),
        )
        jsModule = await import(/* @vite-ignore */ jsModuleUrl)
        URL.revokeObjectURL(jsModuleUrl)
      } catch (error) {
        console.error('eval', error)
        if (error instanceof Error || typeof error === 'string') {
          sendBack({ type: 'renderer.failure', error })
        } else {
          throw error
        }
      }

      // validate module
      if (jsModule == null) return
      const assemblyResult = designAssemblySafeParse(jsModule)

      if (assemblyResult == null) return
      if (assemblyResult.success) {
        console.log('render', assemblyResult.data)
        const { meta, assembly } = assemblyResult.data
        if (typeof assembly === 'function') {
          // TODO: fix
          // @ts-ignore
          const { parameters, presets } = assemblyResult.data
          sendBack({
            type: 'renderer.success',
            output: {
              type: 'assembly' as const,
              meta,
              parameters,
              presets,
              // TODO: fix
              // @ts-ignore
              // createParts: assembly,
              createParts: (...args) => Promise.resolve(assembly(...args)),
            },
          })
        } else {
          sendBack({
            type: 'renderer.success',
            output: {
              type: 'assembly' as const,
              meta,
              parameters: null,
              presets: null,
              // TODO: fix
              // @ts-ignore
              createParts: () => Promise.resolve(assembly),
            },
          })
        }
      } else {
        const error = assemblyResult.error
        console.error('validate', error)
        sendBack({
          type: 'renderer.failure',
          error,
        })
      }
    }
  },
)
