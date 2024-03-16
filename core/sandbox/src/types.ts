import type { DesignAssemblyPlugins, DesignMeta, DesignParts } from '@villagekit/design'
import type {
  ExtractValuesFromParams,
  Params,
  Presets,
} from '@villagekit/parameters'
import type { PartVariantsByType } from '@villagekit/part'
import type { ZodError } from 'zod'

export type DesignFileAssembly = {
  type: 'assembly'
  code: string
  language: 'javascript' | 'typescript'
}
export type DesignFile = DesignFileAssembly

export type DesignRenderAssembly<Ps extends Params = never> = {
  type: 'assembly'
  meta: DesignMeta
  parameters: Ps extends never ? null : Ps
  presets: Ps extends never ? null : Presets<Ps>
  assembly: Ps extends never
    ? () => Promise<DesignParts>
    : (
        parameters: ExtractValuesFromParams<Ps>,
        partVariants: PartVariantsByType,
      ) => Promise<DesignParts>
  plugins?: DesignAssemblyPlugins
}
export type DesignRender<Ps extends Params> =
  null | DesignRenderAssembly<Ps>

export type DesignRenderErrorStackFrame = {
  name: string
  line: number
  column: number
}
export type DesignRenderError =
  | null
  | {
      type: 'typescript.transform'
      error: string
    }
  | {
      type: 'javascript.evaluate'
      error: {
        message: string
        stack: Array<DesignRenderErrorStackFrame>
      }
    }

export type DesignValidationError = ZodError | null
export type DesignValidationKey = keyof NonNullable<DesignRender<any>>
export type DesignValidationErrors = Partial<Record<DesignValidationKey, DesignValidationError>>
export type ExtendDesignValidationErrors = (errors: DesignValidationErrors) => void

export type DesignInstance<Ps extends Params = never> = {
  file: DesignFile
  render: DesignRender<Ps>
  renderError: DesignRenderError
  validationErrors: DesignValidationErrors
  parameterValues: Ps extends never
    ? null
    : ExtractValuesFromParams<Ps>
}
