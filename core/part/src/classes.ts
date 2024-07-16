import type { FunctionComponent } from 'react'
import type { Box3 } from 'three'
import type { FasteningPoint } from './types'

export class PartCreator {
  id = 'base'

  static toObject() {}

  id: Id
  variants: Variants
  components: {
    PartsSummary: PartsSummary<SummaryValue>
    PartsGl: PartsGl<GlValue>
  }
  methods: {
    calculateGlValue: CalculatePartGlValue<Creator, GlValue>
    calculateBoundingBox: CalculatePartBoundingBox<GlValue>
    calculateSummaryValue: CalculatePartSummaryValue<Creator, SummaryValue>
    calculateSummaryKey: CalculatePartSummaryKey<SummaryValue>
    calculateFasteningPoints: CalculatePartFasteningPoints<Creator>
    calculateNumFastenersToFasten: CalculateNumFastenersToFasten<Creator>
  }
  schema: ZodSchema
}

export class PartGl<P extends PartCreator> {
  static fromPart<P2 extends PartCreator, G extends PartGl<P2>>(_part: P2): G {
    throw new Error('Not implemented')
  }
}

export class PartSummary {
}

// vvv should this involve an XState machine to handle adding and removing parts better?
//   ... or should there be a generic XState machine that can be created given a renderer.

export interface PartRenderer<P extends PartCreator> {
  components: {
    PartsSummary: FunctionComponent<{ parts: Array<P> }>
    PartsGl: FunctionComponent<{ parts: Array<P> }>
  }
  methods: {
    calculateBoundingBox: (part: P) => Box3
    calculateSummaryValue: (part: P) =>
    calculateFasteningPoints: (part: P) => Array<FasteningPoint<P>>
    calculateNumFastenersToFasten: (part: P) => number
  }
}

export type PartModule<P extends PartCreator, R extends PartRenderer<P>> = {
  Creator: P
  Renderer: R
}
