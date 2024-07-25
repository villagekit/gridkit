import type { AxisId, Point3 } from '@villagekit/math'
import type { Length } from '@villagekit/units'
import type { Quaternion } from 'three'

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
  axis: AxisId
  locationInGrids: Point3
  lengthInGrids: number
}

export type GridBeamGlValue = GridBeamState & {
  // variant
  gridLengthInMeters: number
  holeDiameterInMeters: number
  // axis
  direction: Point3
  quaternion: Quaternion
  // location
  locationInMeters: Point3
  position: [number, number, number]
  // length
  lengthInGrids: number
  lengthInMeters: number
  // size
  sizeInGrids: [number, number, number]
  sizeInMeters: [number, number, number]
}
