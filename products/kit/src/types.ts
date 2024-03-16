import type {
  ExtractValuesFromParams,
  Params,
  ParamsValues,
  Presets,
} from '@villagekit/parameters'
import type { PartCreator, PartVariantsByType } from '@villagekit/part'
import type { Plugin } from './plugins'

export type Product<Ps extends Params = never> = {
  type: 'kit'
  parameters: Ps
  presets: Ps extends never ? never : Presets<Ps>
  parts: Ps extends never ? Parts : PartsFn<Ps>
}

export type Part = WithOptionalId<PartCreator>
export type Parts = RecursiveArray<Part | false | undefined | null>

export type { Params, Presets, ParamsValues, PartVariantsByType }

export type PartsFn<Ps extends Params> = (
  parameters: ExtractValuesFromParams<Ps>,
  partVariants: PartVariantsByType,
) => Parts

export type Plugins = Array<Plugin>

/* utils */

export type WithOptionalId<T extends { id: string }> = { id?: string } & {
  [Key in keyof T as Exclude<Key, 'id'>]: T[Key]
}
export interface RecursiveArray<T> extends Array<T | RecursiveArray<T>> {}
