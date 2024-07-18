import type { AxisId, Direction, Location, ScaleX } from '@villagekit/math'
import type { Length } from '@villagekit/units'
import type { Quaternion } from 'three'
import type { gridBeamVariants } from './variants'

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

export type GridBeamCreator = {
  id?: string
  type: GridBeamType
  variant?: keyof typeof gridBeamVariants
  axis: AxisId
  locationInGrids: Location
  lengthInGrids: ScaleX
}

export type GridBeamState = GridBeamCreator & {
  variant: GridBeamVariant
}

export type GridBeamGlValue = GridBeamState & {
  // variant
  gridLengthInMeters: number
  holeDiameterInMeters: number
  // axis
  direction: Direction
  quaternion: Quaternion
  // location
  locationInMeters: Location
  position: [number, number, number]
  // length
  lengthInGrids: ScaleX
  lengthInMeters: ScaleX
  // size
  sizeInGrids: [number, number, number]
  sizeInMeters: [number, number, number]
}

export type GridBeamSummaryValue = {
  type: GridBeamType
  variant: GridBeamVariant
  lengthInGrids: ScaleX
}
