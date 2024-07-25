import type { AxisId, Point3 } from '@villagekit/math'
import type { Length } from '@villagekit/units'

export type GridPanelType = 'gridpanel'

export interface GridPanelVariant {
  id: string
  gridLength: Length
  holeDiameter: Length
  thickness: Length
  materials: {
    panel: {
      textureUrl: string
    }
  }
}

export type GridPanelFit = 'top' | 'bottom'
export type GridPanelHoles = boolean | Array<[number, number]>

export type GridPanelState = {
  id: string
  type: GridPanelType
  variant: GridPanelVariant
  mainAxis: AxisId
  mainStart: number
  mainLength: number
  crossAxis: AxisId
  crossStart: number
  crossLength: number
  thicknessAxis: AxisId
  thicknessStart: number
  fit: GridPanelFit
  holes: GridPanelHoles
}

export type GridPanelGlValue = GridPanelState & {
  gridLengthInMeters: number
  holeDiameterInMeters: number
  thicknessInMeters: number
  locationInGrids: Point3
  locationInMeters: Point3
  sizeInMeters: [number, number, number]
}
