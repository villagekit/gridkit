import * as Comlink from 'comlink'
import { deserializeParts, serializeParts } from '../helpers'

Comlink.transferHandlers.set('MODULE', {
  canHandle: (mod): mod is unknown => mod != null && (mod as any).isModule,
  serialize: (mod: any) => {
    if (typeof mod.parts === 'function') {
      const { parameters, presets, plugins } = mod
      const { port1, port2 } = new MessageChannel()
      Comlink.expose(mod.parts, port1)
      return [{ type: 'parametric', parameters, presets, parts: port2, plugins }, [port2]]
    }
    const { plugins } = mod
    const parts = serializeParts(mod.parts)
    return [{ type: 'static', parts, plugins }, []]
  },
  deserialize(obj: any) {
    if (obj.type === 'static') {
      const { plugins } = obj
      const parts = deserializeParts(obj.parts)
      return { type: 'static', parts, plugins }
    }
    const { parameters, presets, plugins } = obj
    const parts = Comlink.wrap(obj.parts)
    return { type: 'parametric', parameters, presets, parts, plugins }
  },
})

Comlink.transferHandlers.set('PARTS', {
  canHandle(value): value is unknown {
    return value != null && (value as any).isParts
  },
  serialize(value) {
    // @ts-ignore
    return [serializeParts(value), []]
  },
  deserialize(obj) {
    // @ts-ignore
    return deserializeParts(obj)
  },
})
