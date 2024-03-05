import { RenderOutput, RenderError } from './'
import { designAssemblySafeParse } from '@villagekit/design'
import { assign, fromPromise, setup } from 'xstate'

export const rendererJavaScriptAssemblyMachine = setup({
  types: {} as {
    context: {
      code: string
      output: RenderOutput<any>
      error: RenderError
    }
    input: {
      code: string
    }
  },
  actors: {
    renderJavaScriptAssembly: fromPromise(async ({ input }: { input: { code: string } }) =>
      renderJavaScriptAssembly(input.code),
    ),
  },
}).createMachine({
  id: 'renderer:javascript:assembly',
  initial: 'idle',
  context: ({ input }) => ({
    code: input.code,
    output: null,
    error: null,
  }),
  states: {
    idle: {
      on: {
        'renderer.render': {
          target: 'rendering',
        },
      },
    },
    rendering: {
      invoke: {
        src: 'renderJavaScriptAssembly',
        input: ({ context: { code } }) => ({ code }),
        onDone: {
          target: 'idle',
          actions: assign({ output: ({ event }) => event.output }),
        },
        onError: {
          target: 'idle',
          actions: assign({
            error: ({ event }) => {
              const error = event.error
              if (error instanceof Error || typeof error === 'string') {
                return error
              }
              throw error
            },
          }),
        },
      },
      on: {
        'renderer.done': {
          target: 'idle',
        },
      },
    },
  },
})

async function renderJavaScriptAssembly(jsCode: string) {
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
    const jsModuleUrl = URL.createObjectURL(new Blob([jsModuleCode], { type: 'text/javascript' }))
    jsModule = await import(/* @vite-ignore */ jsModuleUrl)
    URL.revokeObjectURL(jsModuleUrl)
  } catch (error) {
    console.error('eval', error)
    throw error
  }

  // validate module
  if (jsModule == null) return null
  const assemblyResult = designAssemblySafeParse(jsModule)

  if (assemblyResult == null) return null
  if (assemblyResult.success) {
    console.log('render', assemblyResult.data)
    const { meta, assembly } = assemblyResult.data
    if (typeof assembly === 'function') {
      // TODO: fix
      // @ts-ignore
      const { parameters, presets } = assemblyResult.data
      return {
        type: 'assembly' as const,
        meta,
        parameters,
        presets,
        // TODO: fix
        // @ts-ignore
        // createParts: assembly,
        createParts: (...args) => Promise.resolve(assembly(...args)),
      }
    } else {
      return {
        type: 'assembly' as const,
        meta,
        parameters: null,
        presets: null,
        // TODO: fix
        // @ts-ignore
        createParts: () => Promise.resolve(assembly),
      }
    }
  } else {
    const error = assemblyResult.error
    console.error('validate', error)
    throw error
  }
}
