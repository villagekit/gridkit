import type { ScaleX } from '@villagekit/math'
import type { WithRequiredId } from '@villagekit/part'
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

export type FastenerState = Pick<Fastener, 'type' | 'transforms'> & {
  id: string
  variant: FastenerVariant
}

export type FastenerGlValue = Omit<FastenerState, 'transforms'> & {
  extrusionLengthInMeters: number
  fastenedLengthInMeters: ScaleX
  position: Vector3
  quaternion: Quaternion
}
