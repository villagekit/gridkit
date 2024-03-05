import { ParametersOptions } from '@villagekit/parameters'
import { assign, sendTo, setup, ActorRefFrom } from 'xstate'
import React, { useEffect } from 'react'
import { useMachine } from '@xstate/react'

import { DesignFile, DesignRender } from '../types'
import { javascriptAssemblyRenderer } from './javascript'
import { typescriptAssemblyRenderer } from './typescript'

export type RenderInputEvent = {
  type: 'render'
  code: string
}

export type RenderOutput<ParamsOptions extends ParametersOptions> =
  DesignRender<ParamsOptions> | null
export type RenderError = string | Error | null

export type RendererProps<ParamsOptions extends ParametersOptions> = {
  setRender: (render: RenderOutput<ParamsOptions>) => void
  setError: (error: RenderError) => void
}

export function DesignRenderer<ParamsOptions extends ParametersOptions>(
  props: RendererProps<ParamsOptions> & { file: DesignFile },
): React.ReactNode {
  const { file, setRender, setError } = props

  const [state, send] = useMachine(rendererMachine)

  useEffect(() => {
    switch (file.type) {
      case 'assembly':
        switch (file.language) {
          case 'typescript':
            return send({ type: 'renderer.render.typescript', code: file.code })
          case 'javascript':
            return send({ type: 'renderer.render.javascript', code: file.code })
        }
    }
  }, [send, file])

  useEffect(() => {
    setRender(state.context.output)
    setError(state.context.error)
  }, [state, setRender, setError])

  return <React.Fragment />
}

export const rendererMachine = setup({
  types: {} as {
    context: {
      rendererRefs:
        | null
        | [
            ActorRefFrom<typeof javascriptAssemblyRenderer>,
            ActorRefFrom<typeof typescriptAssemblyRenderer>,
          ]
      output: RenderOutput<any>
      error: RenderError
    }
    events:
      | {
          type: 'renderer.render.javascript'
          code: string
        }
      | {
          type: 'renderer.render.typescript'
          code: string
        }
      | {
          type: 'renderer.success'
          output: RenderOutput<any>
        }
      | {
          type: 'renderer.failure'
          error: RenderError
        }
  },
}).createMachine({
  id: 'renderer',
  context: {
    rendererRefs: null,
    output: null,
    error: null,
  },
  entry: assign({
    rendererRefs: ({ spawn }) => {
      // @ts-ignore
      const javascriptAssemblyRendererRef = spawn(javascriptAssemblyRenderer, {
        id: 'javascriptAssemblyRenderer',
      })
      // @ts-ignore
      const typescriptAssemblyRendererRef = spawn(typescriptAssemblyRenderer, {
        id: 'typescriptAssemblyRenderer',
        input: {
          javascriptAssemblyRenderer: javascriptAssemblyRendererRef,
        },
      })
      return [javascriptAssemblyRendererRef, typescriptAssemblyRendererRef]
    },
  }),
  on: {
    'renderer.render.javascript': {
      actions: sendTo('javascriptAssemblyRenderer', ({ event }) => ({
        type: 'render',
        code: event.code,
      })),
    },
    'renderer.render.typescript': {
      actions: sendTo('typescriptAssemblyRenderer', ({ event }) => ({
        type: 'render',
        code: event.code,
      })),
    },
    'renderer.success': {
      actions: assign({
        output: ({ event }) => event.output,
        error: null,
      }),
    },
    'renderer.failure': {
      actions: assign({
        error: ({ event }) => event.error,
      }),
    },
  },
})
