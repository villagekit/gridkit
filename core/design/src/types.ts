import {
  ExtractValuesFromParametersOptions,
  ParametersOptions,
  Presets,
  getPresetsSchema,
  parametersOptionsSchema,
} from '@villagekit/parameters'
import { PartCreator, PartVariantsByType, partSchema } from '@villagekit/part'

// import { AssemblyPlugin } from './plugins'
import { ZodSchema, z } from 'zod'
import { AssemblyPlugin } from '.'

export type DesignPart = WithOptionalId<PartCreator>
export type DesignParts = RecursiveArray<DesignPart | false | undefined | null>

export const designCategorySchema = z.enum(['seating', 'tables', 'storage', 'office'])
export type DesignCategory = z.infer<typeof designCategorySchema>

export const designMetaSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1),
  categories: z.array(designCategorySchema).optional(),
})
export type DesignMeta = z.infer<typeof designMetaSchema>

export function DesignMeta(designMeta: DesignMeta): DesignMeta {
  return designMeta
}

export const designPartSchema = z.intersection(
  partSchema,
  z.object({
    id: z.string().optional(),
  }),
)

const designPartsSchema: z.ZodType<RecursiveArray<z.infer<typeof designPartSchema>>> = z.lazy(
  () => {
    return z.array(z.union([designPartSchema, designPartsSchema]))
  },
)

export interface DesignAssemblyBase {
  plugins?: Array<AssemblyPlugin>
}

export const designAssemblyStaticSchema = z.object({
  type: z.literal('static'),
  parts: designPartsSchema,
})
export interface DesignAssemblyStatic extends DesignAssemblyBase {
  type: 'static'
  parts: DesignParts
}

export const designAssemblyParameterizedSchema = (presetsSchema: ZodSchema) =>
  z.object({
    type: z.literal('parameterized'),
    parameters: parametersOptionsSchema,
    presets: presetsSchema,
    createParts: z.function(),
  })

// TODO: fix
// @ts-ignore
export function designAssemblySafeParse(assembly: { type: 'parameterized' | 'static' }) {
  if (assembly.type === 'static') {
    return designAssemblyStaticSchema.safeParse(assembly)
  } else if (assembly.type === 'parameterized') {
    const assemblyResult = designAssemblyParameterizedSchema(z.array(z.unknown())).safeParse(
      assembly,
    )
    if (assemblyResult.success) {
      const { parameters } = assemblyResult.data
      // TODO: fix
      // @ts-ignore
      return designAssemblyParameterizedSchema(getPresetsSchema(parameters)).safeParse(assembly)
    } else {
      return assemblyResult
    }
  }
}

export interface DesignAssemblyParameterized<ParamsOptions extends ParametersOptions>
  extends DesignAssemblyBase {
  type: 'parameterized'
  parameters: ParamsOptions
  presets: Presets<ParamsOptions>
  createParts: (
    parameters: ExtractValuesFromParametersOptions<ParamsOptions>,
    partVariants: PartVariantsByType,
  ) => DesignParts
}

export type DesignAssembly = DesignAssemblyStatic | DesignAssemblyParameterized<any>

export function DesignAssembly(assembly: Omit<DesignAssemblyStatic, 'type'>): DesignAssemblyStatic {
  return {
    type: 'static',
    ...assembly,
  }
}

export function DesignAssemblyParameterized<ParamsOptions extends ParametersOptions,>(
  assembly: Omit<DesignAssemblyParameterized<ParamsOptions>, 'type'>,
): DesignAssemblyParameterized<ParamsOptions> {
  return {
    type: 'parameterized',
    ...assembly,
  }
}

export interface DesignInstanceStatic {
  type: 'static'
  meta: DesignMeta
  assembly: DesignAssemblyStatic
}

export interface DesignInstanceParameterized<ParamsOptions extends ParametersOptions,> {
  type: 'parameterized'
  meta: DesignMeta
  assembly: DesignAssemblyParameterized<ParamsOptions>
  parameterValues: ExtractValuesFromParametersOptions<ParamsOptions> | null
}

export type DesignInstance = DesignInstanceStatic | DesignInstanceParameterized<any>

export type Design = {
  meta: DesignMeta
  assembly: DesignAssembly
}

/* utils */

export type WithOptionalId<T extends { id: string }> = { id?: string } & {
  [Key in keyof T as Exclude<Key, 'id'>]: T[Key]
}
export interface RecursiveArray<T> extends Array<T | RecursiveArray<T>> {}
