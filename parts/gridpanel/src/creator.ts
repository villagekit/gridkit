import { BasePartCreator } from '@villagekit/part/creator'
import { convert, meter } from '@villagekit/units'
import type { GridPanelFit, GridPanelHoles, GridPanelState, GridPanelVariant } from './types'
import { gridPanelVariants } from './variants'

const getDefaultVariantId = (): keyof typeof gridPanelVariants => '40mm:8mm:12mm:douglas-fir'

const X_AXIS: [number, number, number] = [1, 0, 0]
const Y_AXIS: [number, number, number] = [0, 1, 0]
const Z_AXIS: [number, number, number] = [0, 0, 1]

export class GridPanel extends BasePartCreator<'gridpanel'> {
  variantId: keyof typeof gridPanelVariants
  sizeInGrids: [number, number]
  fit: GridPanelFit
  holes: GridPanelHoles

  constructor(options: GridPanelOptions) {
    const {
      id,
      variantId = getDefaultVariantId(),
      sizeInGrids,
      fit = 'bottom',
      holes = true,
    } = options
    super('gridpanel', id)
    this.variantId = variantId
    this.sizeInGrids = sizeInGrids
    this.fit = fit
    this.holes = holes
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

    let panel = new GridPanel({
      id,
      variantId,
      sizeInGrids: [Math.abs(x[0] - x[1]), Math.abs(y[0] - y[1])],
      fit,
      holes,
    })
      .rotate({
        angle: x[0] <= x[1] ? 0 : 180,
        origin: pivot,
        direction: Y_AXIS,
      })
      .rotate({
        angle: y[0] <= y[1] ? 0 : 180,
        origin: pivot,
        direction: X_AXIS,
      })
      .translate([x[0] * gridUnit, y[0] * gridUnit, z * gridUnit])

    if (fit === 'top') {
      panel = panel.translate([0, 0, gridUnit - thickness])
    }

    return panel
  }

  static YZ(options: GridPanelYZOptions) {
    const { id, variantId = getDefaultVariantId(), x, y, z, fit, holes } = options

    const variant = getVariant(variantId)
    const gridUnit = getGridLength(variant)
    const thickness = getThickness(variant)
    const pivot: [number, number, number] = [0.5 * gridUnit, 0.5 * gridUnit, 0.5 * thickness]

    let panel = new GridPanel({
      id,
      variantId,
      sizeInGrids: [Math.abs(y[0] - y[1]), Math.abs(z[0] - z[1])],
      fit,
      holes,
    })
      .rotate({
        angle: 90,
        origin: pivot,
        direction: Z_AXIS,
      })
      .rotate({
        angle: z[0] <= z[1] ? 90 : -90,
        origin: pivot,
        direction: Y_AXIS,
      })
      .rotate({
        angle: y[0] <= y[1] ? 0 : 180,
        origin: pivot,
        direction: Z_AXIS,
      })
      .translate([x * gridUnit, y[0] * gridUnit, z[0] * gridUnit])

    if (fit === 'top') {
      panel = panel.translate([gridUnit - thickness, 0, 0])
    }

    return panel
  }

  static XZ(options: GridPanelXZOptions) {
    const { id, variantId = getDefaultVariantId(), x, y, z, fit, holes } = options

    const variant = getVariant(variantId)
    const gridUnit = getGridLength(variant)
    const thickness = getThickness(variant)
    const pivot: [number, number, number] = [0.5 * gridUnit, 0.5 * gridUnit, 0.5 * thickness]

    let panel = new GridPanel({
      id,
      variantId,
      sizeInGrids: [Math.abs(x[0] - x[1]), Math.abs(z[0] - z[1])],
      fit,
      holes,
    })
      .rotate({
        angle: z[0] <= z[1] ? 90 : -90,
        origin: pivot,
        direction: X_AXIS,
      })
      .rotate({
        angle: x[0] <= x[1] ? 0 : 180,
        origin: pivot,
        direction: Z_AXIS,
      })
      .translate([x[0] * gridUnit, y * gridUnit, z[0] * gridUnit])

    if (fit === 'top') {
      panel = panel.translate([0, gridUnit - thickness, 0])
    }

    return panel
  }
}

interface BaseOptions {
  id?: string
  fit?: GridPanelFit
  holes?: GridPanelState['holes']
}

interface GridPanelOptions extends BaseOptions {
  variantId: keyof typeof gridPanelVariants
  sizeInGrids: [number, number]
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
