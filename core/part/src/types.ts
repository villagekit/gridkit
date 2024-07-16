import type { AxisId, Location } from '@villagekit/math'
import type { ReactElement } from 'react'
import type { Box3 } from 'three'
import type { ZodSchema } from 'zod'

import type { BasePartSummaryValue, PartsGlProps, PartsSummaryProps } from './base'
import type { PartBase } from './classes'

declare global {
  namespace VK {
    export interface EveryPartTypeId {}
    export interface EveryPartCreator {}
  }
}

// https://github.com/piotrwitek/utility-types/blob/master/src/utility-types.ts
type $Values<T extends object> = T[keyof T]

export type PartTypeId = $Values<VK.EveryPartTypeId>
export type PartCreator = $Values<VK.EveryPartCreator>

export type PartCreatorBase = {
  id: string
}

export type FasteningPoint<P extends PartBase> = {
  cellPosition: Location
  facePosition: Location
  axis: AxisId
  part: P
  gradient: number
}

export type CalculatePartGlValue<Creator, GlValue> = (creator: Creator) => GlValue
export type CalculatePartBoundingBox<GlValue> = (value: GlValue) => Box3
export type CalculatePartSummaryValue<Creator, SummaryValue> = (creator: Creator) => SummaryValue
export type CalculatePartSummaryKey<SummaryValue> = (summaryValue: SummaryValue) => string
export type CalculatePartFasteningPoints<Creator> = (
  creator: Creator,
) => Array<FasteningPoint<Creator>>
export type CalculateNumFastenersToFasten<Creator> = (creator: Creator) => number

export type PartsGl<GlValue> = (props: PartsGlProps<GlValue>) => ReactElement | null
export type PartsSummary<SummaryValue extends BasePartSummaryValue> = (
  props: PartsSummaryProps<SummaryValue>,
) => ReactElement | null

export interface PartModule<
  Id extends string,
  Creator extends PartCreator,
  GlValue,
  SummaryValue extends BasePartSummaryValue,
  Variants,
> {
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
