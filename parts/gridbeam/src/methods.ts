import {
  AxisId,
  type Location,
  axisIdToDirection,
  axisIdToDirectionVector,
  directionToAxisId,
  mapRange,
} from '@villagekit/math'
import type { FasteningPoint, WithRequiredId } from '@villagekit/part'
import { convert, meter } from '@villagekit/units'
import { Box3, Matrix4, Quaternion, Vector3 } from 'three'
import { degToRad } from 'three/src/math/MathUtils.js'
import type { GridBeam } from './creator'
import type { GridBeamGlValue, GridBeamState, GridBeamVariant } from './types'
import { gridBeamVariants } from './variants'

const X_AXIS = axisIdToDirectionVector(AxisId.X)

export function calculateState(creator: WithRequiredId<GridBeam>): GridBeamState {
  const { type, id, variantId, lengthInGrids, transforms } = creator

  const variant = gridBeamVariants[variantId]
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
  const locationInGrids = position.divideScalar(gridLengthInMeters).round().toArray()

  const direction = X_AXIS.clone().applyQuaternion(quaternion).toArray()
  const axis = directionToAxisId(direction)

  if (axis == null) {
    throw new Error(`gridbeam direction axis is not standard: [${direction.join(', ')}]`)
  }

  return {
    id,
    type,
    variant,
    axis,
    locationInGrids,
    lengthInGrids,
  }
}

export function calculateGlValue(state: GridBeamState): GridBeamGlValue {
  const {
    axis,
    locationInGrids,
    lengthInGrids,
    variant: { holeDiameter },
  } = state

  const gridLengthInMeters = getGridLengthInMeters(state.variant)
  const holeDiameterInMeters = convert(holeDiameter, meter).value

  const direction = axisIdToDirection(axis)
  const directionVector = axisIdToDirectionVector(axis)
  const quaternion = new Quaternion().setFromUnitVectors(X_AXIS, directionVector)

  const locationInMeters = [
    locationInGrids[0] * gridLengthInMeters,
    locationInGrids[1] * gridLengthInMeters,
    locationInGrids[2] * gridLengthInMeters,
  ] as [number, number, number]
  const position: GridBeamGlValue['position'] = [
    (locationInGrids[0] + 0.5) * gridLengthInMeters,
    (locationInGrids[1] + 0.5) * gridLengthInMeters,
    (locationInGrids[2] + 0.5) * gridLengthInMeters,
  ]

  const lengthInMeters = lengthInGrids * gridLengthInMeters

  const sizeInGrids = getSizeInGrids(state)
  const sizeInMeters = [
    sizeInGrids[0] * gridLengthInMeters,
    sizeInGrids[1] * gridLengthInMeters,
    sizeInGrids[2] * gridLengthInMeters,
  ] as [number, number, number]

  return {
    ...state,
    direction,
    gridLengthInMeters,
    holeDiameterInMeters,
    lengthInGrids,
    lengthInMeters,
    locationInMeters,
    position,
    quaternion,
    sizeInGrids,
    sizeInMeters,
  }
}

export function calculateBoundingBox(value: GridBeamGlValue): Box3 {
  const { sizeInMeters, locationInMeters } = value

  return new Box3().setFromPoints([
    new Vector3(...locationInMeters),
    new Vector3(...locationInMeters).add(new Vector3(...sizeInMeters)),
  ])
}

export function calculateSummaryKey(creator: GridBeam): string {
  const { type, variantId, lengthInGrids } = creator

  return `${type}::${variantId}::${lengthInGrids}`
}

const fasteningAxesByAxisId: Record<AxisId, Array<AxisId>> = {
  [AxisId.X]: [AxisId.Y, AxisId['-Y'], AxisId.Z, AxisId['-Z']],
  [AxisId['-X']]: [AxisId.Y, AxisId['-Y'], AxisId.Z, AxisId['-Z']],
  [AxisId.Y]: [AxisId.X, AxisId['-X'], AxisId.Z, AxisId['-Z']],
  [AxisId['-Y']]: [AxisId.X, AxisId['-X'], AxisId.Z, AxisId['-Z']],
  [AxisId.Z]: [AxisId.X, AxisId['-X'], AxisId.Y, AxisId['-Y']],
  [AxisId['-Z']]: [AxisId.X, AxisId['-X'], AxisId.Y, AxisId['-Y']],
}

export function calculateFasteningPoints(state: GridBeamState): Array<FasteningPoint> {
  const { locationInGrids, lengthInGrids, axis } = state

  const direction = axisIdToDirection(axis)

  const points: Array<Location> = new Array(lengthInGrids)
  for (let index = 0; index < lengthInGrids; index++) {
    points[index] = [
      locationInGrids[0] + direction[0] * index,
      locationInGrids[1] + direction[1] * index,
      locationInGrids[2] + direction[2] * index,
    ]
  }

  const fasteningAxes = fasteningAxesByAxisId[axis]
  const fasteningPoints: Array<FasteningPoint> = new Array(lengthInGrids * fasteningAxes.length)
  let fasteningPointIndex = 0
  for (
    let fasteningAxisIndex = 0;
    fasteningAxisIndex < fasteningAxes.length;
    fasteningAxisIndex++
  ) {
    const fasteningAxis = fasteningAxes[fasteningAxisIndex]
    if (fasteningAxis === undefined) throw new Error('unexpected: fasteningAxis is undefined')
    const offset = axisIdToDirection(fasteningAxis)

    for (let pointIndex = 0; pointIndex < points.length; pointIndex++) {
      const point = points[pointIndex]
      if (point === undefined) throw new Error('unexpected: point is undefined')
      const facePosition = [
        point[0] + offset[0] * 0.5,
        point[1] + offset[1] * 0.5,
        point[2] + offset[2] * 0.5,
      ] as [number, number, number]

      const iHalved =
        pointIndex >= lengthInGrids / 2 ? Math.abs(pointIndex - lengthInGrids + 1) : pointIndex
      const gradient = mapRange(iHalved, 0, Math.floor(lengthInGrids / 2), 1, 0)

      fasteningPoints[fasteningPointIndex++] = {
        axis: fasteningAxis,
        cellPosition: point,
        facePosition,
        gradient,
        part: state,
      }
    }
  }
  return fasteningPoints
}

export function calculateNumFastenersToFasten(_state: GridBeamState): number {
  return 2
}

function getGridLengthInMeters(variant: GridBeamVariant): number {
  const { gridLength } = variant

  return convert(gridLength, meter).value
}

function getSizeInGrids(state: GridBeamState): [number, number, number] {
  const { axis, lengthInGrids } = state
  switch (axis) {
    case AxisId.X:
    case AxisId['-X']:
      return [lengthInGrids, 1, 1]
    case AxisId.Y:
    case AxisId['-Y']:
      return [1, lengthInGrids, 1]
    case AxisId.Z:
    case AxisId['-Z']:
      return [1, 1, lengthInGrids]
  }
}
