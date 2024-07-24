import type { Direction, Location, ScaleX } from '@villagekit/math'
import type { Length } from '@villagekit/units'
import type { Quaternion } from 'three'

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

export type FastenerState = {
  id: string
  type: FastenerType
  variant: FastenerVariant
  start: Location
  end: Location
  direction: Direction
}

export type FastenerGlValue = FastenerState & {
  extrusionLengthInMeters: number
  fastenedLengthInMeters: ScaleX
  position: [number, number, number]
  quarternion: Quaternion
}
