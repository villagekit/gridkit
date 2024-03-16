import { useMachine } from '@xstate/react'
import { useEffect, useState } from 'react'
import { type ActorRefFrom, assign, sendTo, setup } from 'xstate'
import type { Render, RenderError } from '../types'
import { javascriptRenderer } from './javascript'
import { typescriptRenderer } from './typescript'

type RenderOptions = {
  filePath: string
  code: string
}

type RenderOutput = {
  render: Render
  renderError: RenderError
}

export function useRender(options: RenderOptions): RenderOutput {
  const { filePath, code } = options

  const [render, setRender] = useState<DesignRender<any>>(null)
  const [renderError, setRenderError] = useState<DesignRenderError>(null)

  const [state, send] = useMachine(rendererMachine)

  const language = filePath.endsWith('.ts')
    ? 'typescript'
    : filePath.endsWith('.js')
      ? 'javascript'
      : 'unknown'

  if (language === 'unknown') throw new Error(`Unexpected kit file path extension: ${filePath}`)

  useEffect(() => {
    switch (language) {
      case 'typescript':
        return send({ type: 'renderer.render.typescript', code })
      case 'javascript':
        return send({ type: 'renderer.render.javascript', code })
    }
  }, [send, language, code])

  useEffect(() => {
    const { render, renderError } = state.context
    setRender(render)
    setRenderError(renderError)
  }, [state.context])

  return { render, renderError }
}

export const rendererMachine = setup({
  types: {} as {
    context: {
      rendererRefs:
        | null
        | [ActorRefFrom<typeof javascriptRenderer>, ActorRefFrom<typeof typescriptRenderer>]
      render: DesignRender<any>
      renderError: DesignRenderError
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
          render: DesignRender<any>
        }
      | {
          type: 'renderer.failure'
          renderError: DesignRenderError
        }
  },
}).createMachine({
  id: 'kit-renderer',
  context: {
    rendererRefs: null,
    render: null,
    renderError: null,
  },
  entry: assign({
    rendererRefs: ({ spawn }) => {
      // @ts-ignore
      const javascriptRendererRef = spawn(javascriptRenderer, {
        id: 'javascriptRenderer',
      })
      // @ts-ignore
      const typescriptRendererRef = spawn(typescriptRenderer, {
        id: 'typescriptRenderer',
        input: {
          javascriptRenderer: javascriptRendererRef,
        },
      })
      return [javascriptRendererRef, typescriptRendererRef]
    },
  }),
  on: {
    'renderer.render.javascript': {
      actions: sendTo('javascriptRenderer', ({ event }) => ({
        type: 'render',
        code: event.code,
      })),
    },
    'renderer.render.typescript': {
      actions: sendTo('typescriptRenderer', ({ event }) => ({
        type: 'render',
        code: event.code,
      })),
    },
    'renderer.success': {
      actions: assign({
        render: ({ event }) => event.render,
        renderError: null,
      }),
    },
    'renderer.failure': {
      actions: assign({
        renderError: ({ event }) => event.renderError,
      }),
    },
  },
})
