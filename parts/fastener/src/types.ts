import type { Length } from '@villagekit/units'
import type { Quaternion, Vector3 } from 'three'
import type { Fastener } from './creator'

export type FastenerType = 'fastener'

export interface FastenerVariant {
  id: string
  boltDiameter: Length
  boltLabel: 'bolt' | 'threaded rod'
  boltLength: Length
  endDiameter: Length
  extrusionLength: Length
  gridLength: Length
  fastenedLength: Length
  materials: {
    fastener: {
      textureUrl: string
    }
  }
  models: {
    fastener: {
      modelUrl: string
    }
  }
  nutDiameter: Length
  nutLength: Length
}

export type FastenerState = Pick<Fastener, 'type' | 'transform'> & {
  id: string
  variant: FastenerVariant
}

export type FastenerGlValue = Omit<FastenerState, 'transform'> & {
  extrusionLengthInMeters: number
  fastenedLengthInMeters: number
  position: Vector3
  quaternion: Quaternion
}
