import {
  AxisId,
  type AxisValues,
  axisIdToDirection,
  axisIdToDirectionVector,
  axisValuesToVector,
  directionToAxisId,
  flipAxisId,
  mapRange,
} from '@villagekit/math'
import type { FasteningPoint, WithRequiredId } from '@villagekit/part'
import { convert, meter } from '@villagekit/units'
import generateKey, { sorted as generateKeySorted } from 'deadbeef'
import { Box3, Matrix4, Quaternion, Vector3 } from 'three'
import { degToRad } from 'three/src/math/MathUtils.js'
import { type GridPanel, gridPanelVariants } from './creator'
import type { GridPanelGlValue, GridPanelState, GridPanelVariant } from './types'

const X_AXIS = axisIdToDirectionVector(AxisId.X)
const Y_AXIS = axisIdToDirectionVector(AxisId.Y)
const Z_AXIS = axisIdToDirectionVector(AxisId.Z)

export function calculateState(creator: WithRequiredId<GridPanel>): GridPanelState {
  const { type, id, variantId, sizeInGrids, fit, holes, transforms } = creator

  const variant = gridPanelVariants[variantId]
  if (variant == null) {
    throw new Error(`Unknown gridbeam variant: ${variantId}`)
  }

  const matrix = new Matrix4()
  for (const transform of transforms) {
    switch (transform.type) {
      case 'translation':
        matrix.premultiply(new Matrix4().makeTranslation(...transform.vector))
        break
      case 'rotation': {
        // https://stackoverflow.com/a/55138754
        /*
        const pivotMatrix = new Matrix4().makeTranslation(...transform.origin)
        const pivotInverseMatrix = pivotMatrix.clone().invert()
        matrix.premultiply(pivotInverseMatrix)
        */
        const rotationMatrix = new Matrix4().makeRotationAxis(
          new Vector3(...transform.direction),
          degToRad(transform.angle),
        )
        matrix.premultiply(rotationMatrix)
        // matrix.premultiply(pivotMatrix)
        break
      }
    }
  }
  const position = new Vector3()
  const quaternion = new Quaternion()
  const scale = new Vector3()
  matrix.decompose(position, quaternion, scale)

  const gridLengthInMeters = getGridLengthInMeters(variant)
  const startInGrids = roundTo(position.divideScalar(gridLengthInMeters), 10).toArray()

  const mainDirection = X_AXIS.clone().applyQuaternion(quaternion).toArray()
  let mainAxis = directionToAxisId(mainDirection)
  if (mainAxis == null) {
    throw new Error(`gridpanel main direction axis is not standard: [${mainDirection.join(', ')}]`)
  }
  let mainStart = getAxisStart(mainAxis, startInGrids)
  const mainLength = sizeInGrids[0]
  if (isNegativeAxis(mainAxis)) {
    mainAxis = flipAxisId(mainAxis)
    mainStart = mainStart - mainLength + 1
  }

  const crossDirection = Y_AXIS.clone().applyQuaternion(quaternion).toArray()
  let crossAxis = directionToAxisId(crossDirection)
  if (crossAxis == null) {
    throw new Error(
      `gridpanel cross direction axis is not standard: [${crossDirection.join(', ')}]`,
    )
  }
  let crossStart = getAxisStart(crossAxis, startInGrids)
  const crossLength = sizeInGrids[1]
  if (isNegativeAxis(crossAxis)) {
    crossAxis = flipAxisId(crossAxis)
    crossStart = crossStart - crossLength + 1
  }

  const thicknessDirection = Z_AXIS.clone().applyQuaternion(quaternion).toArray()
  let thicknessAxis = directionToAxisId(thicknessDirection)
  if (thicknessAxis == null) {
    throw new Error(
      `gridpanel thickness direction axis is not standard: [${thicknessDirection.join(', ')}]`,
    )
  }
  const thicknessStart = getAxisStart(thicknessAxis, startInGrids)
  if (isNegativeAxis(thicknessAxis)) {
    thicknessAxis = flipAxisId(thicknessAxis)
  }

  return {
    type,
    id,
    variant,
    mainAxis,
    mainStart,
    mainLength,
    crossAxis,
    crossStart,
    crossLength,
    thicknessAxis,
    thicknessStart,
    fit,
    holes,
  }
}

export function calculateGlValue(state: GridPanelState): GridPanelGlValue {
  const {
    variant: { gridLength, holeDiameter, thickness },
    fit,
    mainAxis,
    mainStart,
    mainLength,
    crossAxis,
    crossStart,
    crossLength,
    thicknessAxis,
    thicknessStart,
  } = state

  const gridLengthInMeters = convert(gridLength, meter).value
  const holeDiameterInMeters = convert(holeDiameter, meter).value
  const thicknessInMeters = convert(thickness, meter).value

  const sizeInMeters = axisValuesToVector({
    [crossAxis]: crossLength * gridLengthInMeters,
    [mainAxis]: mainLength * gridLengthInMeters,
    [thicknessAxis]: thicknessInMeters,
  } as AxisValues) as GridPanelGlValue['sizeInMeters']

  const fitAdjustment = axisValuesToVector({
    [crossAxis]: 0,
    [mainAxis]: 0,
    [thicknessAxis]: fit === 'top' ? gridLengthInMeters - thicknessInMeters : 0,
  } as AxisValues)

  const locationInGrids = axisValuesToVector({
    [crossAxis]: crossStart,
    [mainAxis]: mainStart,
    [thicknessAxis]: thicknessStart,
  } as AxisValues)
  const locationInMeters = [
    locationInGrids[0] * gridLengthInMeters + fitAdjustment[0],
    locationInGrids[1] * gridLengthInMeters + fitAdjustment[1],
    locationInGrids[2] * gridLengthInMeters + fitAdjustment[2],
  ] as [number, number, number]

  return {
    ...state,
    crossAxis,
    crossLength,
    fit,
    gridLengthInMeters,
    holeDiameterInMeters,
    locationInGrids,
    locationInMeters,
    mainAxis,
    mainLength,
    sizeInMeters,
    thicknessAxis,
    thicknessInMeters,
  }
}

export function calculateBoundingBox(value: GridPanelGlValue): Box3 {
  const { sizeInMeters, locationInMeters } = value

  return new Box3().setFromPoints([
    new Vector3(...locationInMeters),
    new Vector3(...locationInMeters).add(new Vector3(...sizeInMeters)),
  ])
}

export function calculateSummaryKey(part: GridPanel): string {
  const { type, sizeInGrids, variantId } = part
  let { holes } = part

  if (typeof holes === 'boolean') {
    return generateKey(type, variantId, ...sizeInGrids, holes)
  }

  if (sizeInGrids[1] > sizeInGrids[0]) {
    // need to "rotate" panel so main length is larger side
    holes = holes.map((hole) => [hole[1], hole[0]])
  }

  return (
    generateKey(type, variantId, ...sizeInGrids) +
    generateKeySorted(...holes.map(([a, b]) => `${a},${b}`))
  )
}

export function calculateFasteningPoints(state: GridPanelState): Array<FasteningPoint> {
  const {
    fit,
    crossAxis,
    crossStart,
    crossLength,
    mainAxis,
    mainLength,
    mainStart,
    thicknessAxis,
    thicknessStart,
    holes = true,
    variant: { gridLength, thickness },
  } = state

  if (holes === false) return []

  const mainAxisDirection = axisIdToDirection(mainAxis)
  const crossAxisDirection = axisIdToDirection(crossAxis)

  const start = axisValuesToVector({
    [crossAxis]: crossStart,
    [mainAxis]: mainStart,
    [thicknessAxis]: thicknessStart,
  } as AxisValues)

  const axis = fit !== 'top' ? flipAxisId(thicknessAxis) : thicknessAxis

  const offset = axisIdToDirection(axis)

  const direction = axisIdToDirection(axis)
  const thicknessRatio = thickness.value / gridLength.value

  const holesMap = holes === true ? true : getHolesMap(holes)

  const fasteningPoints: Array<FasteningPoint> =
    holes === true ? new Array(mainLength * crossLength) : new Array(holes.length)

  let holeIndex = 0
  for (let crossIndex = 0; crossIndex < crossLength; crossIndex++) {
    if (holesMap !== true && holesMap[crossIndex] === undefined) {
      continue
    }

    const crossIndexHalved =
      crossIndex >= crossLength / 2 ? Math.abs(crossIndex - crossLength + 1) : crossIndex
    const crossIndexGradient = mapRange(crossIndexHalved, 0, Math.floor(crossLength / 2), 1, 0.5)

    for (let mainIndex = 0; mainIndex < mainLength; mainIndex++) {
      if (holesMap !== true && holesMap?.[crossIndex]?.[mainIndex] === undefined) {
        continue
      }

      const point = [
        start[0] + crossAxisDirection[0] * crossIndex + mainAxisDirection[0] * mainIndex,
        start[1] + crossAxisDirection[1] * crossIndex + mainAxisDirection[1] * mainIndex,
        start[2] + crossAxisDirection[2] * crossIndex + mainAxisDirection[2] * mainIndex,
      ] as const

      const facePosition = [
        point[0] + offset[0] * 0.5 - direction[0] * thicknessRatio,
        point[1] + offset[1] * 0.5 - direction[1] * thicknessRatio,
        point[2] + offset[2] * 0.5 - direction[2] * thicknessRatio,
      ] as const

      const mainIndexHalved =
        mainIndex >= mainLength / 2 ? Math.abs(mainIndex - mainLength + 1) : mainIndex
      const mainIndexGradient = mapRange(mainIndexHalved, 0, Math.floor(mainLength / 2), 1, 0.5)

      const gradient = mapRange(crossIndexGradient * mainIndexGradient, 0.25, 1, 0, 1)

      fasteningPoints[holeIndex++] = {
        axis,
        cellPosition: point,
        facePosition,
        gradient: gradient,
        part: state,
      }
    }
  }

  return fasteningPoints
}

function getHolesMap(holes: Array<[number, number]>): Record<number, Record<number, true>> {
  const holesMap: Record<number, Record<number, true>> = {}
  for (let index = 0; index < holes.length; index++) {
    const hole = holes[index]
    if (hole === undefined) continue
    const [hole0, hole1] = hole
    const nextHoles = holesMap[hole0] ?? {}
    nextHoles[hole1] = true
    holesMap[hole0] = nextHoles
  }
  return holesMap
}

export function calculateNumFastenersToFasten(_state: GridPanelState): number {
  return 2
}

function getGridLengthInMeters(variant: GridPanelVariant): number {
  const { gridLength } = variant

  return convert(gridLength, meter).value
}

function getAxisStart(axisId: AxisId, startInGrids: [number, number, number]) {
  switch (axisId) {
    case AxisId.X:
    case AxisId['-X']:
      return startInGrids[0]
    case AxisId.Y:
    case AxisId['-Y']:
      return startInGrids[1]
    case AxisId.Z:
    case AxisId['-Z']:
      return startInGrids[2]
  }
}

function isNegativeAxis(axisId: AxisId) {
  switch (axisId) {
    case AxisId.X:
    case AxisId.Y:
    case AxisId.Z:
      return false
    case AxisId['-X']:
    case AxisId['-Y']:
    case AxisId['-Z']:
      return true
  }
}

function roundTo(vector: Vector3, divisions: number) {
  return vector.multiplyScalar(divisions).round().divideScalar(divisions)
}
