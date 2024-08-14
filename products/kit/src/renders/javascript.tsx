import '@villagekit/part-gridpanel/creator'
import '@villagekit/part-gridbeam/creator'
import '@villagekit/part-fastener/creator'

import { AnyMap, type TraceMap, originalPositionFor } from '@jridgewell/trace-mapping'
import { BasePartCreator, deserialize, serialize } from '@villagekit/part/creator'
import * as Comlink from 'comlink'
import { parseStackTrace } from 'errorstacks'
import { fromCallback } from 'xstate'
import type { Params, ParamsValues, PartVariantsByType, Parts, Presets } from '../types'
import type { RenderEvent, RendererMachineEvent } from './'

type Evaluator = {
  loadModule: (code: string) => Promise<string>
  evaluateModule: () => Promise<{
    parameters: Params | null
    presets: Presets<any> | null
    parts: Parts | null
    plugins: Array<string> | undefined
  }>
  evaluateParts: (paramsValues: ParamsValues, partVariants: PartVariantsByType) => Promise<Parts>
}

Comlink.transferHandlers.set('PartCreator', {
  canHandle: (obj: unknown): obj is unknown => obj != null && obj instanceof BasePartCreator,
  serialize: (obj) => [serialize(obj), []],
  deserialize,
})

export const javascriptRenderer = fromCallback<RenderEvent, RendererMachineEvent>(
  ({ sendBack, receive }) => {
    const worker = new Worker(new URL('./javascript-worker', import.meta.url), { type: 'module' })
    worker.onerror = (error) => console.error('worker', error)
    worker.onmessageerror = (error) => console.error('worker', error)
    const evaluator = Comlink.wrap<Evaluator>(worker)

    receive((event) => {
      handleCode(event.code)
    })

    return () => {
      evaluator[Comlink.releaseProxy]()
      worker.terminate()
    }

    async function handleCode(jsCode: string) {
      const traceMap = getTraceMap(jsCode)

      const moduleUrl = await evaluator.loadModule(jsCode)

      let jsModule: Awaited<ReturnType<Evaluator['evaluateModule']>>
      try {
        jsModule = await evaluator.evaluateModule()
      } catch (error) {
        sendEvaluationError(error)
        return
      }

      if (jsModule == null) return

      if (jsModule.parameters == null || jsModule.presets == null) {
        const { plugins } = jsModule
        /*
        const partObjects = jsModule.parts ?? []
        console.log('eval: part objects', partObjects)
        const partInstances = partObjects.map(deserialize)
        console.log('eval: part instances', partInstances)
        const event: RendererMachineEvent = {
          type: 'renderer.success',
          render: {
            type: 'static',
            parts: partInstances,
            plugins,
          },
        }
        */
        const parts = jsModule.parts ?? []
        console.log('parts', parts)
        const event: RendererMachineEvent = {
          type: 'renderer.success',
          render: {
            type: 'static',
            parts,
            plugins,
          },
        }
        sendBack(event)
      } else {
        const { parameters, presets, plugins } = jsModule
        const event: RendererMachineEvent = {
          type: 'renderer.success',
          render: {
            type: 'parametric',
            parameters,
            presets,
            parts: async (paramsValues: ParamsValues, partVariants: PartVariantsByType) => {
              try {
                const partObjects = await evaluator.evaluateParts(paramsValues, partVariants)
                console.log('eval: part objects', partObjects)
                const partInstances = partObjects.map(deserialize)
                console.log('eval: part instances', partInstances)
                return partInstances
              } catch (error) {
                sendEvaluationError(error)
                return []
              }
            },
            plugins,
          },
        }

        sendBack(event)
      }

      function sendEvaluationError(error: unknown) {
        console.error('error', error)
        const tracedError =
          error instanceof Error
            ? traceError(error, moduleUrl, traceMap)
            : { message: String(error), stack: [] }
        const event: RendererMachineEvent = {
          type: 'renderer.failure',
          renderError: {
            type: 'error:stack',
            title: 'JavaScript evaluation',
            ...tracedError,
          },
        }
        sendBack(event)
      }
    }
  },
)

function getTraceMap(code: string) {
  const sourceMapLine = code.substring(code.lastIndexOf('\n', code.length - 1) + 1, code.length)
  const sourceMapData = sourceMapLine.substring(sourceMapLine.indexOf(',') + 1)
  const sourceMapContent = atob(sourceMapData)
  const traceMap = new AnyMap(sourceMapContent)
  return traceMap
}

function traceError(error: Error, moduleUrl: string, traceMap: TraceMap) {
  const message = error.message

  if (error.stack == null) {
    return { message, stack: [] }
  }

  let stack = parseStackTrace(error.stack)

  const lastStackIndex = stack.findIndex((frame) => frame.fileName === moduleUrl)
  if (lastStackIndex !== -1) {
    stack = stack.slice(0, lastStackIndex + 1)
  }

  const tracedStack = stack.map((frame) => {
    const { name, line, column } = frame
    const originalPosition = originalPositionFor(traceMap, { line, column })
    return {
      name,
      line: originalPosition.line || line,
      column: originalPosition.column || column,
    }
  })

  return {
    message,
    stack: tracedStack,
  }
}
