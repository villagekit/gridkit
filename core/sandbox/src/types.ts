import { DesignAssembly, DesignMeta, DesignParts } from '@villagekit/design'
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
  assembly: (
    parameters: ExtractValuesFromParametersOptions<ParamsOptions>,
    partVariants: PartVariantsByType,
  ) => Promise<DesignParts>
}
export type DesignRender<ParamsOptions extends ParametersOptions = never> =
  DesignRenderAssembly<ParamsOptions>

export type DesignInstance<ParamsOptions extends ParametersOptions = never> = {
  file: DesignFile
  render: DesignRender<ParametersOptions>
  parameterValues: ParamsOptions extends never
    ? null
    : ExtractValuesFromParametersOptions<ParamsOptions>
}
