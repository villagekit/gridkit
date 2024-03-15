import type { DesignAssemblyPlugins, DesignMeta, DesignParts } from '@villagekit/design'
import type {
  ExtractValuesFromParameters,
  Parameters,
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

export type DesignRenderAssembly<Params extends Parameters = never> = {
  type: 'assembly'
  meta: DesignMeta
  parameters: Params extends never ? null : Params
  presets: Params extends never ? null : Presets<Params>
  assembly: Params extends never
    ? () => Promise<DesignParts>
    : (
        parameters: ExtractValuesFromParameters<Params>,
        partVariants: PartVariantsByType,
      ) => Promise<DesignParts>
  plugins?: DesignAssemblyPlugins
}
export type DesignRender<Params extends Parameters> =
  null | DesignRenderAssembly<Params>

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

export type DesignInstance<Params extends Parameters = never> = {
  file: DesignFile
  render: DesignRender<Params>
  renderError: DesignRenderError
  validationErrors: DesignValidationErrors
  parameterValues: Params extends never
    ? null
    : ExtractValuesFromParameters<Params>
}
