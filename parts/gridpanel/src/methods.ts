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
import type { GridPanel } from './creator'
import type { GridPanelGlValue } from './types'
import { gridPanelVariants } from './variants'

const X_AXIS = axisIdToDirectionVector(AxisId.X)
const Y_AXIS = axisIdToDirectionVector(AxisId.Y)
const Z_AXIS = axisIdToDirectionVector(AxisId.Z)

export function calculateGlValue(creator: WithRequiredId<GridPanel>): GridPanelGlValue {
  const { type, id, variantId, sizeInGrids, transform, holes } = creator

  const variant = gridPanelVariants[variantId]
  if (variant == null) {
    throw new Error(`Unknown gridpanel variant: ${variantId}`)
  }

  const gridLengthInMeters = convert(variant.gridLength, meter).value
  const holeDiameterInMeters = convert(variant.holeDiameter, meter).value
  const thicknessInMeters = convert(variant.thickness, meter).value

  const matrix = new Matrix4().fromArray(transform)
  const position = new Vector3()
  const quaternion = new Quaternion()
  const scale = new Vector3()
  matrix.decompose(position, quaternion, scale)

  return {
    type,
    id,
    variant,
    sizeInGrids,
    holes,
    gridLengthInMeters,
    holeDiameterInMeters,
    thicknessInMeters,
    position,
    quaternion,
  }
}

export function calculateBoundingBox(creator: GridPanel): Box3 {
  const { variantId, sizeInGrids, transform } = creator

  const variant = gridPanelVariants[variantId]
  if (variant == null) {
    throw new Error(`Unknown gridpanel variant: ${variantId}`)
  }
  const gridUnit = convert(variant.gridLength, meter).value
  const halfGridUnit = 0.5 * gridUnit

  const box = new Box3(
    new Vector3(-halfGridUnit, -halfGridUnit, -halfGridUnit),
    new Vector3(
      sizeInGrids[0] * gridUnit - halfGridUnit,
      sizeInGrids[1] * gridUnit - halfGridUnit,
      halfGridUnit,
    ),
  )

  box.applyMatrix4(new Matrix4().fromArray(transform))

  return box
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

export function calculateFasteningPoints(
  creator: WithRequiredId<GridPanel>,
): Array<FasteningPoint> {
  const { variantId, sizeInGrids, fit, holes, transform } = creator

  if (holes === false) return []

  const variant = gridPanelVariants[variantId]
  if (variant == null) {
    throw new Error(`Unknown gridpanel variant: ${variantId}`)
  }

  const gridLengthInMeters = convert(variant.gridLength, meter).value
  const thicknessInMeters = convert(variant.thickness, meter).value

  const matrix = new Matrix4().fromArray(transform)
  const position = new Vector3()
  const quaternion = new Quaternion()
  const scale = new Vector3()
  matrix.decompose(position, quaternion, scale)

  const mainDirection = X_AXIS.clone().applyQuaternion(quaternion).toArray()
  let mainAxis = directionToAxisId(mainDirection)
  if (mainAxis == null) {
    throw new Error(`gridpanel main direction axis is not standard: [${mainDirection.join(', ')}]`)
  }
  const crossDirection = Y_AXIS.clone().applyQuaternion(quaternion).toArray()
  let crossAxis = directionToAxisId(crossDirection)
  if (crossAxis == null) {
    throw new Error(
      `gridpanel cross direction axis is not standard: [${crossDirection.join(', ')}]`,
    )
  }
  const thicknessDirection = Z_AXIS.clone().applyQuaternion(quaternion).toArray()
  let thicknessAxis = directionToAxisId(thicknessDirection)
  if (thicknessAxis == null) {
    throw new Error(
      `gridpanel thickness direction axis is not standard: [${thicknessDirection.join(', ')}]`,
    )
  }

  // reverse the fit adjustment
  if (fit === 'top') {
    const fitAdjustment = axisValuesToVector({
      [crossAxis]: 0,
      [mainAxis]: 0,
      [thicknessAxis]: fit === 'top' ? gridLengthInMeters - thicknessInMeters : 0,
    } as AxisValues)
    position.add(new Vector3(...fitAdjustment))
  }

  const startInGrids = roundTo(position.divideScalar(gridLengthInMeters), 10).toArray()

  let mainStart = getAxisStart(mainAxis, startInGrids)
  const mainLength = sizeInGrids[0]
  if (isNegativeAxis(mainAxis)) {
    mainAxis = flipAxisId(mainAxis)
    mainStart = mainStart - mainLength + 1
  }

  let crossStart = getAxisStart(crossAxis, startInGrids)
  const crossLength = sizeInGrids[1]
  if (isNegativeAxis(crossAxis)) {
    crossAxis = flipAxisId(crossAxis)
    crossStart = crossStart - crossLength + 1
  }

  const thicknessStart = getAxisStart(thicknessAxis, startInGrids)
  if (isNegativeAxis(thicknessAxis)) {
    thicknessAxis = flipAxisId(thicknessAxis)
  }

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
  const thicknessRatio = variant.thickness.value / variant.gridLength.value

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
        part: creator,
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

export function calculateNumFastenersToFasten(_creator: GridPanel): number {
  return 2
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
