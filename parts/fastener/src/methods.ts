import type { FasteningPoint, WithRequiredId } from '@villagekit/part'
import { convert, meter } from '@villagekit/units'
import { Box3, Matrix4, Quaternion, Vector3 } from 'three'

import weakMemoize from '@emotion/weak-memoize'
import type { Fastener } from './creator'
import type { FastenerGlValue, FastenerState, FastenerVariant } from './types'
import { fastenerVariants } from './variants'

export function calculateState(creator: WithRequiredId<Fastener>): FastenerState {
  const { type, id, variantId, transform } = creator

  const variant = fastenerVariants[variantId]
  if (variant == null) {
    throw new Error(`Unknown gridbeam variant: ${variantId}`)
  }

  return {
    type,
    id,
    variant,
    transform,
  }
}

const getExtrusionLength = weakMemoize(
  (variant: FastenerVariant) => convert(variant.extrusionLength, meter).value,
)

const getFastenedLength = weakMemoize(
  (variant: FastenerVariant) => convert(variant.fastenedLength, meter).value,
)

export function calculateGlValue(state: FastenerState): FastenerGlValue {
  const { type, id, variant, transform } = state

  const extrusionLengthInMeters = getExtrusionLength(variant)
  const fastenedLengthInMeters = getFastenedLength(variant)

  const matrix = new Matrix4().fromArray(transform)
  const position = new Vector3()
  const quaternion = new Quaternion()
  const scale = new Vector3()
  matrix.decompose(position, quaternion, scale)

  return {
    id,
    type,
    variant,
    position,
    quaternion,
    extrusionLengthInMeters,
    fastenedLengthInMeters,
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
