import type { Length } from '@villagekit/units'
import type { Quaternion, Vector3 } from 'three'

export type GridBeamType = 'gridbeam'

export type GridBeamVariant = {
  id: string
  gridLength: Length
  holeDiameter: Length
  materials: {
    beam: {
      textureUrl: string
    }
  }
}

export type GridBeamState = {
  id: string
  type: GridBeamType
  variant: GridBeamVariant
  lengthInGrids: number
  position: Vector3
  quaternion: Quaternion
}

export type GridBeamGlValue = GridBeamState & {
  // variant
  gridLengthInMeters: number
  holeDiameterInMeters: number
  // length
  lengthInMeters: number
}
