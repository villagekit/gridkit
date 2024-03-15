import type {
  ExtractValuesFromParameters,
  Parameters,
  ParametersValues,
  Presets,
} from '@villagekit/parameters'
import type { PartCreator, PartVariantsByType } from '@villagekit/part'
import type { z } from 'zod'
import type { Plugin } from './plugins'
import type { categorySchema, metaSchema } from './schema'

export type Part = WithOptionalId<PartCreator>
export type Parts = RecursiveArray<Part | false | undefined | null>

export type Category = z.infer<typeof categorySchema>
export type Meta = z.infer<typeof metaSchema>

export type { Parameters, Presets, ParametersValues, PartVariantsByType }

export type Kit<Params extends Parameters = never> = (
  parameters: ExtractValuesFromParameters<Params>,
  partVariants: PartVariantsByType,
) => Parts
export type Plugins = Array<Plugin>

/* utils */

export type WithOptionalId<T extends { id: string }> = { id?: string } & {
  [Key in keyof T as Exclude<Key, 'id'>]: T[Key]
}
export interface RecursiveArray<T> extends Array<T | RecursiveArray<T>> {}
