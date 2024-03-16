import type { ExtractValuesFromParams, Params, ParamsValues, Presets } from '@villagekit/parameters'
import type { PartCreator, PartVariantsByType } from '@villagekit/part'
import type { ZodError } from 'zod'
import type { Plugin } from './plugins'

export type Product<Ps extends Params = never> = {
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

/* render */

export type Render<Ps extends Params = never> = {
  parameters: Ps extends never ? null : Ps
  presets: Ps extends never ? null : Presets<Ps>
  assembly: Ps extends never
    ? () => Promise<Parts>
    : (parameters: ExtractValuesFromParams<Ps>, partVariants: PartVariantsByType) => Promise<Parts>
  plugins?: Plugins
}

export type RenderErrorStackFrame = {
  name: string
  line: number
  column: number
}
export type RenderError =
  | null
  | {
      type: 'typescript.transform'
      error: string
    }
  | {
      type: 'javascript.evaluate'
      error: {
        message: string
        stack: Array<RenderErrorStackFrame>
      }
    }

export type ValidationError = ZodError | null
export type ValidationKey = keyof NonNullable<Render<any>>
export type ValidationErrors = Partial<Record<ValidationKey, ValidationError>>
export type ExtendDesignValidationErrors = (errors: ValidationErrors) => void
