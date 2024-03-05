import { DesignAssemblyPlugins, DesignMeta, DesignParts } from '@villagekit/design'
import {
  ExtractValuesFromParametersOptions,
  ParametersOptions,
  Presets,
} from '@villagekit/parameters'
import { PartVariantsByType } from '@villagekit/part'

export type DesignFileAssembly = {
  type: 'assembly'
  code: string
  language: 'javascript' | 'typescript'
}
export type DesignFile = DesignFileAssembly

export type DesignRenderAssembly<ParamsOptions extends ParametersOptions = never> = {
  type: 'assembly'
  meta: DesignMeta
  parameters: ParamsOptions extends never ? null : ParamsOptions
  presets: ParamsOptions extends never ? null : Presets<ParamsOptions>
  createParts: ParamsOptions extends never
    ? () => Promise<DesignParts>
    : (
        parameters: ExtractValuesFromParametersOptions<ParamsOptions>,
        partVariants: PartVariantsByType,
      ) => Promise<DesignParts>
  plugins?: DesignAssemblyPlugins
}
export type DesignRenderOutput<ParamsOptions extends ParametersOptions> =
  DesignRenderAssembly<ParamsOptions> | null
export type DesignRenderError = string | Error | null
export type DesignRender = {
  output: DesignRenderOutput<any>
  error: DesignRenderError
}

export type DesignInstance<ParamsOptions extends ParametersOptions = never> = {
  file: DesignFile
  render: DesignRender
  parameterValues: ParamsOptions extends never
    ? null
    : ExtractValuesFromParametersOptions<ParamsOptions>
}
