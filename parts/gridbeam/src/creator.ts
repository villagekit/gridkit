import { BasePartCreator, type PartTransform } from '@villagekit/part/creator'
import { convert, meter } from '@villagekit/units'

import { millimeter } from '@villagekit/units'
import type { GridBeamVariant } from './types'

const gridBeamVariants: Record<string, GridBeamVariant> = {
  '40mm:8mm:douglas-fir': {
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
    id: '40mm:8mm:douglas-fir',
    materials: {
      beam: {
        textureUrl:
          'https://res.cloudinary.com/villagekit/image/upload/dpr_auto,f_auto,q_auto:good/v1/textures/douglas-fir_adsycy',
      },
    },
  },
}

const getDefaultVariantId = () => '40mm:8mm:douglas-fir'

const Y_AXIS: [number, number, number] = [0, 1, 0]
const Z_AXIS: [number, number, number] = [0, 0, 1]

export class GridBeam extends BasePartCreator<'gridbeam'> {
  variantId: keyof typeof gridBeamVariants
  lengthInGrids: number

  constructor(options: GridBeamOptions) {
    const { id, variantId, lengthInGrids, transforms } = options
    super('gridbeam', id, transforms)
    this.variantId = variantId ?? getDefaultVariantId()
    this.lengthInGrids = lengthInGrids
  }

  static create(options: GridBeamOptions) {
    return new GridBeam(options)
  }

  static X(options: GridBeamXOptions) {
    const { id, x, y, z, variantId = getDefaultVariantId() } = options

    const gridUnit = getGridLengthInMeters(variantId)
    const halfGridUnit = 0.5 * gridUnit

    return new GridBeam({
      id,
      variantId,
      lengthInGrids: Math.abs(x[0] - x[1]),
      transforms: [
        {
          type: 'rotation',
          angle: x[0] <= x[1] ? 0 : 180,
          origin: [halfGridUnit, halfGridUnit, halfGridUnit],
          direction: Y_AXIS,
        },
        {
          type: 'translation',
          vector: [x[0] * gridUnit, y * gridUnit, z * gridUnit],
        },
      ],
    })
  }

  static Y(options: GridBeamYOptions) {
    const { id, x, y, z, variantId = getDefaultVariantId() } = options

    const gridUnit = getGridLengthInMeters(variantId)
    const halfGridUnit = 0.5 * gridUnit

    return new GridBeam({
      id,
      variantId,
      lengthInGrids: Math.abs(y[0] - y[1]),
      transforms: [
        {
          type: 'rotation',
          angle: y[0] <= y[1] ? 90 : -90,
          origin: [halfGridUnit, halfGridUnit, halfGridUnit],
          direction: Z_AXIS,
        },
        {
          type: 'translation',
          vector: [x * gridUnit, y[0] * gridUnit, z * gridUnit],
        },
      ],
    })
  }

  static Z(options: GridBeamZOptions) {
    const { id, x, y, z, variantId = getDefaultVariantId() } = options

    const gridUnit = getGridLengthInMeters(variantId)
    const halfGridUnit = 0.5 * gridUnit

    return new GridBeam({
      id,
      variantId,
      lengthInGrids: Math.abs(z[0] - z[1]),
      transforms: [
        {
          type: 'rotation',
          angle: z[0] <= z[1] ? 90 : -90,
          origin: [halfGridUnit, halfGridUnit, halfGridUnit],
          direction: Y_AXIS,
        },
        {
          type: 'translation',
          vector: [x * gridUnit, y * gridUnit, z[0] * gridUnit],
        },
      ],
    })
  }
}

interface BaseOptions {
  id?: string
}

interface GridBeamOptions extends BaseOptions {
  variantId: keyof typeof gridBeamVariants
  lengthInGrids: number
  transforms?: Array<PartTransform>
}

interface GridBeamXOptions extends BaseOptions {
  variantId?: keyof typeof gridBeamVariants
  x: [number, number]
  y: number
  z: number
}

interface GridBeamYOptions extends BaseOptions {
  variantId?: keyof typeof gridBeamVariants
  x: number
  y: [number, number]
  z: number
}

interface GridBeamZOptions extends BaseOptions {
  variantId?: keyof typeof gridBeamVariants
  x: number
  y: number
  z: [number, number]
}

function getGridLengthInMeters(variantId: string): number {
  const variant = gridBeamVariants[variantId]
  if (variant == null) {
    throw new Error(`Unknown gridbeam variant: ${variantId}`)
  }
  const { gridLength } = variant
  return convert(gridLength, meter).value
}
