import { BasePartCreator, type PartTransform } from '@villagekit/part/creator'
import { convert, meter } from '@villagekit/units'

import { millimeter } from '@villagekit/units'
import type { GridPanelState, GridPanelVariant } from './types'

export const gridPanelVariants: Record<string, GridPanelVariant> = {
  '40mm:8mm:12mm:douglas-fir': {
    gridLength: {
      type: 'quantity',
      unit: millimeter,
      value: 40,
    },
    holeDiameter: {
      type: 'quantity',
      unit: millimeter,
      value: 8,
    },
    id: '40mm:8mm:12mm:douglas-fir',
    materials: {
      panel: {
        textureUrl:
          'https://res.cloudinary.com/villagekit/image/upload/dpr_auto,f_auto,q_auto:good/v1/textures/douglas-fir_adsycy',
      },
    },
    thickness: {
      type: 'quantity',
      unit: millimeter,
      value: 12,
    },
  },
}

const getDefaultVariantId = (): keyof typeof gridPanelVariants => '40mm:8mm:12mm:douglas-fir'

const X_AXIS: [number, number, number] = [1, 0, 0]
const Y_AXIS: [number, number, number] = [0, 1, 0]
const Z_AXIS: [number, number, number] = [0, 0, 1]

export class GridPanel extends BasePartCreator<'gridpanel'> {
  variantId: keyof typeof gridPanelVariants
  sizeInGrids: [number, number]
  fit: GridPanelState['fit']
  holes: GridPanelState['holes']

  constructor(options: GridPanelOptions) {
    const { id, variantId, sizeInGrids, fit, holes, transforms } = options
    super('gridpanel', id, transforms)
    this.variantId = variantId ?? getDefaultVariantId()
    this.sizeInGrids = sizeInGrids
    this.fit = fit ?? 'bottom'
    this.holes = holes ?? true
  }

  static create(options: GridPanelOptions) {
    return new GridPanel(options)
  }

  static XY(options: GridPanelXYOptions) {
    const { id, variantId = getDefaultVariantId(), x, y, z, fit, holes } = options

    const variant = getVariant(variantId)
    const gridUnit = getGridLength(variant)
    const thickness = getThickness(variant)
    const pivot: [number, number, number] = [0.5 * gridUnit, 0.5 * gridUnit, 0.5 * thickness]

    return new GridPanel({
      id,
      variantId,
      sizeInGrids: [Math.abs(x[0] - x[1]), Math.abs(y[0] - y[1])],
      fit,
      holes,
      transforms: [
        {
          type: 'rotation',
          angle: x[0] <= x[1] ? 0 : 180,
          origin: pivot,
          direction: Y_AXIS,
        },
        {
          type: 'rotation',
          angle: y[0] <= y[1] ? 0 : 180,
          origin: pivot,
          direction: X_AXIS,
        },
        {
          type: 'translation',
          vector: [x[0] * gridUnit, y[0] * gridUnit, z * gridUnit],
        },
      ],
    })
  }

  static YZ(options: GridPanelYZOptions) {
    const { id, variantId = getDefaultVariantId(), x, y, z, fit, holes } = options

    const variant = getVariant(variantId)
    const gridUnit = getGridLength(variant)
    const thickness = getThickness(variant)
    const pivot: [number, number, number] = [0.5 * gridUnit, 0.5 * gridUnit, 0.5 * thickness]

    return new GridPanel({
      id,
      variantId,
      sizeInGrids: [Math.abs(y[0] - y[1]), Math.abs(z[0] - z[1])],
      fit,
      holes,
      transforms: [
        {
          type: 'rotation',
          angle: 90,
          origin: pivot,
          direction: Z_AXIS,
        },
        {
          type: 'rotation',
          angle: z[0] <= z[1] ? 90 : -90,
          origin: pivot,
          direction: Y_AXIS,
        },
        {
          type: 'rotation',
          angle: y[0] <= y[1] ? 0 : 180,
          origin: pivot,
          direction: Z_AXIS,
        },
        {
          type: 'translation',
          vector: [x * gridUnit, y[0] * gridUnit, z[0] * gridUnit],
        },
      ],
    })
  }

  static XZ(options: GridPanelXZOptions) {
    const { id, variantId = getDefaultVariantId(), x, y, z, fit, holes } = options

    const variant = getVariant(variantId)
    const gridUnit = getGridLength(variant)
    const thickness = getThickness(variant)
    const pivot: [number, number, number] = [0.5 * gridUnit, 0.5 * gridUnit, 0.5 * thickness]

    return new GridPanel({
      id,
      variantId,
      sizeInGrids: [Math.abs(x[0] - x[1]), Math.abs(z[0] - z[1])],
      fit,
      holes,
      transforms: [
        {
          type: 'rotation',
          angle: z[0] <= z[1] ? 90 : -90,
          origin: pivot,
          direction: X_AXIS,
        },
        {
          type: 'rotation',
          angle: x[0] <= x[1] ? 0 : 180,
          origin: pivot,
          direction: Z_AXIS,
        },
        {
          type: 'translation',
          vector: [x[0] * gridUnit, y * gridUnit, z[0] * gridUnit],
        },
      ],
    })
  }
}

interface BaseOptions {
  id?: string
  fit?: GridPanelState['fit']
  holes?: GridPanelState['holes']
}

interface GridPanelOptions extends BaseOptions {
  variantId: keyof typeof gridPanelVariants
  sizeInGrids: [number, number]
  transforms?: Array<PartTransform>
}

interface GridPanelXYOptions extends BaseOptions {
  variantId?: keyof typeof gridPanelVariants
  x: [number, number]
  y: [number, number]
  z: number
}

interface GridPanelYZOptions extends BaseOptions {
  variantId?: keyof typeof gridPanelVariants
  x: number
  y: [number, number]
  z: [number, number]
}

interface GridPanelXZOptions extends BaseOptions {
  variantId?: keyof typeof gridPanelVariants
  x: [number, number]
  y: number
  z: [number, number]
}

function getVariant(variantId: string): GridPanelVariant {
  const variant = gridPanelVariants[variantId]
  if (variant == null) {
    throw new Error(`Unknown gridpanel variant: ${variantId}`)
  }
  return variant
}

function getGridLength(variant: GridPanelVariant): number {
  const { gridLength } = variant
  return convert(gridLength, meter).value
}

function getThickness(variant: GridPanelVariant): number {
  const { thickness } = variant
  return convert(thickness, meter).value
}
