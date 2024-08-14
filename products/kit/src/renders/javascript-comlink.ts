import { deserialize, serialize } from '@villagekit/part/creator'

import * as Comlink from 'comlink'
import type { Parts } from '../types'

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

function serializeParts(parts: Parts): Array<any> {
  return parts.map((part) => {
    if (part == null || typeof part === 'boolean') {
      return part
    }
    if (Array.isArray(part)) {
      return serializeParts(part)
    }
    return serialize(part)
  })
}

function deserializeParts(parts: Array<any>): Parts {
  return parts.map((part) => {
    if (part == null || typeof part === 'boolean') {
      return part
    }
    if (Array.isArray(part)) {
      return deserializeParts(part)
    }
    return deserialize(part)
  })
}
