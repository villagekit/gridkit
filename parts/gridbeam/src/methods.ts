import {
  AxisId,
  type Point3,
  axisIdToDirection,
  axisIdToDirectionVector,
  directionToAxisId,
  mapRange,
} from '@villagekit/math'
import type { FasteningPoint, WithRequiredId } from '@villagekit/part'
import { convert, meter } from '@villagekit/units'
import { Box3, Matrix4, Quaternion, Vector3 } from 'three'
import type { GridBeam } from './creator'
import type { GridBeamGlValue, GridBeamState, GridBeamVariant } from './types'
import { gridBeamVariants } from './variants'

const X_AXIS = axisIdToDirectionVector(AxisId.X)

export function calculateState(creator: WithRequiredId<GridBeam>): GridBeamState {
  const { type, id, variantId, lengthInGrids, transform } = creator

  const variant = gridBeamVariants[variantId]
  if (variant == null) {
    throw new Error(`Unknown gridbeam variant: ${variantId}`)
  }

  const matrix = new Matrix4().fromArray(transform)
  const position = new Vector3()
  const quaternion = new Quaternion()
  const scale = new Vector3()
  matrix.decompose(position, quaternion, scale)

  return {
    id,
    type,
    variant,
    lengthInGrids,
    position,
    quaternion,
  }
}

export function calculateGlValue(state: GridBeamState): GridBeamGlValue {
  const { id, type, variant, lengthInGrids, position, quaternion } = state

  const { holeDiameter } = variant

  const gridLengthInMeters = getGridLengthInMeters(state.variant)
  const holeDiameterInMeters = convert(holeDiameter, meter).value
  const lengthInMeters = lengthInGrids * gridLengthInMeters

  return {
    id,
    type,
    variant,
    gridLengthInMeters,
    holeDiameterInMeters,
    lengthInGrids,
    lengthInMeters,
    position,
    quaternion,
  }
}

export function calculateBoundingBox(value: GridBeamGlValue): Box3 {
  const { gridLengthInMeters, lengthInGrids, quaternion } = value

  const gridUnit = gridLengthInMeters
  const halfGridUnit = 0.5 * gridLengthInMeters

  const box = new Box3(
    new Vector3(-halfGridUnit, -halfGridUnit, -halfGridUnit),
    new Vector3(lengthInGrids * gridUnit - halfGridUnit, halfGridUnit, halfGridUnit),
  )

  box.applyMatrix4(new Matrix4().makeRotationFromQuaternion(quaternion))

  return box
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
  const { variant, lengthInGrids, position, quaternion } = state

  const gridLengthInMeters = getGridLengthInMeters(variant)
  const locationInGrids = position.clone().divideScalar(gridLengthInMeters).round().toArray()

  const direction = X_AXIS.clone().applyQuaternion(quaternion).toArray()
  const axis = directionToAxisId(direction)

  if (axis == null) {
    throw new Error(`gridbeam direction axis is not standard: [${direction.join(', ')}]`)
  }

  const points: Array<Point3> = new Array(lengthInGrids)
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
