import weakMemoize from '@emotion/weak-memoize'
import type { FasteningPoint, WithRequiredId } from '@villagekit/part'
import { convert, meter } from '@villagekit/units'
import { Box3, Matrix4, Quaternion, Vector3 } from 'three'

import { degToRad } from 'three/src/math/MathUtils.js'
import type { Fastener } from './creator'
import type { FastenerGlValue, FastenerState, FastenerVariant } from './types'
import { fastenerVariants } from './variants'

const X_AXIS = new Vector3(1, 0, 0)

const getGridLengthInMeters = weakMemoize((variant: FastenerVariant): number => {
  const { gridLength } = variant

  return convert(gridLength, meter).value
})

export function calculateState(creator: WithRequiredId<Fastener>): FastenerState {
  const { type, id, variantId, transforms } = creator

  const variant = fastenerVariants[variantId]
  if (variant == null) {
    throw new Error(`Unknown gridbeam variant: ${variantId}`)
  }

  const matrix = new Matrix4()
  for (const transform of transforms) {
    if (transform == null) continue
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
  const startVector = position.clone().divideScalar(gridLengthInMeters).round()
  const start = startVector.toArray()

  const direction = X_AXIS.clone().applyQuaternion(quaternion).round().toArray()
  const fastenedLength = convert(variant.fastenedLength, meter).value
  const endVector = position
    .clone()
    .add(new Vector3(...direction).multiplyScalar(fastenedLength))
    .divideScalar(gridLengthInMeters)
    .round()
  const end = endVector.toArray()

  return {
    id,
    type,
    variant,
    start,
    direction,
    end,
  }
}

export function calculateGlValue(state: FastenerState): FastenerGlValue {
  const {
    start,
    direction,
    variant: { extrusionLength, fastenedLength },
  } = state

  const extrusionLengthInMeters = convert(extrusionLength, meter).value
  const fastenedLengthInMeters = convert(fastenedLength, meter).value
  const gridLengthInMeters = getGridLengthInMeters(state.variant)

  const position: FastenerGlValue['position'] = [
    (start[0] * 0.5 + 0.5) * gridLengthInMeters,
    (start[1] * 0.5 + 0.5) * gridLengthInMeters,
    (start[2] * 0.5 + 0.5) * gridLengthInMeters,
  ]

  const quarternion: FastenerGlValue['quarternion'] = new Quaternion().setFromUnitVectors(
    X_AXIS,
    new Vector3(...direction),
  )

  return {
    ...state,
    extrusionLengthInMeters,
    fastenedLengthInMeters,
    position,
    quarternion,
  }
}

export function calculateBoundingBox(_value: FastenerGlValue): Box3 {
  return new Box3() // Does not apply to fastener part
}

export function calculateSummaryKey(summary: Fastener): string {
  const { type, variantId } = summary

  return `${type}::${variantId}`
}

export function calculateEstimatedPrice(_state: FastenerState): number {
  return 100
}

export function calculateFasteningPoints(_state: FastenerState): Array<FasteningPoint> {
  return [] // Does not apply to fastener part
}

export function calculateNumFastenersToFasten(_state: FastenerState): number {
  return 0
}
