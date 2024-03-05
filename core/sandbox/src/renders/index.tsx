import { assign, sendTo, setup, ActorRefFrom } from 'xstate'
import { useEffect, useState } from 'react'
import { useMachine } from '@xstate/react'

import { DesignFile, DesignRender, DesignRenderError, DesignRenderOutput } from '../types'
import { javascriptAssemblyRenderer } from './javascript'
import { typescriptAssemblyRenderer } from './typescript'

export type RenderInputEvent = {
  type: 'render'
  code: string
}

export function useDesignRender(options: {
  file: DesignFile
}) {
  const { file } = options

  const [render, setRender] = useState<DesignRender>({
    output: null,
    error: null,
  })

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
    const { output, error } = state.context
    setRender({ output, error })
  }, [state])

  return render
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
      output: DesignRenderOutput<any>
      error: DesignRenderError
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
          output: DesignRenderOutput<any>
        }
      | {
          type: 'renderer.failure'
          error: DesignRenderError
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
