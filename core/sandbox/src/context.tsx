import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  ExtractValuesFromParametersOptions,
  ParameterControlsContextProvider,
  ParametersOptions,
  ParametersValues,
  Presets,
} from '@villagekit/parameters'

import { SandboxAssemblyProvider } from './assembly/context'
import { useDesignRender } from './renders'
import {
  DesignFile,
  DesignInstance,
  DesignRender,
  DesignValidationError,
  DesignValidationErrors,
  DesignValidationKey,
  ExtendDesignValidationErrors,
} from './types'
import {
  designMetaSchema,
  designParametersSchema,
  getDesignPresetsSchema,
} from '@villagekit/design'

type ProviderProps = {
  children: React.ReactNode
}

type SandboxOptions = {
  file: DesignFile
  onLocationUpdate?: (location: Location) => void
}

type SandboxState = DesignInstance<any>

export const SandboxContext = createContext<SandboxState | null>(null)

export function useSandboxContext(): SandboxState {
  const context = useContext(SandboxContext)
  if (context == null) {
    throw new Error('useSandboxContext must be wrapped in SandboxProvider')
  }
  return context
}

export function SandboxProvider(props: SandboxOptions & ProviderProps) {
  const { file, onLocationUpdate, children } = props

  const { render, renderError } = useDesignRender({ file })

  const [parameterValues, setParameterValues] = useState<ParametersValues | null>(null)

  const parameters = render?.parameters
  const presets = render?.presets
  const hasParameters = parameters != null
  const hasPresets = presets != null

  const [validationErrors, setValidationErrors] = useState({})
  const extendValidationErrors = useCallback((nextValidationErrors: DesignValidationErrors) => {
    setValidationErrors((validationErrors) => ({
      ...validationErrors,
      ...nextValidationErrors,
    }))
  }, [])

  useValidateRender(render, extendValidationErrors)

  const state = {
    file,
    render,
    renderError,
    validationErrors,
    parameters,
    presets,
    parameterValues,
  }

  const renderTyped =
    render?.type === 'assembly' ? (
      <SandboxAssemblyProvider
        assembly={render}
        parameterValues={parameterValues}
        extendValidationErrors={extendValidationErrors}
      >
        {children}
      </SandboxAssemblyProvider>
    ) : (
      children
    )

  const parameterized =
    hasParameters && hasPresets ? (
      <SandboxParameters
        onLocationUpdate={onLocationUpdate}
        parameters={parameters}
        presets={presets}
        setParameterValues={setParameterValues}
      >
        {renderTyped}
      </SandboxParameters>
    ) : (
      renderTyped
    )

  return <SandboxContext.Provider value={state}>{parameterized}</SandboxContext.Provider>
}

type SandboxParametersProps<ParamsOptions extends ParametersOptions> = Pick<
  SandboxOptions,
  'onLocationUpdate'
> &
  ProviderProps & {
    parameters: ParamsOptions
    presets: Presets<ParamsOptions>
    setParameterValues: (
      parameterValues: ExtractValuesFromParametersOptions<ParamsOptions> | null,
    ) => void
  }

function SandboxParameters<ParamsOptions extends ParametersOptions>(
  props: SandboxParametersProps<ParamsOptions>,
) {
  const { onLocationUpdate, parameters, presets, setParameterValues, children } = props

  useEffect(() => {
    setParameterValues(presets[0].values)
  }, [setParameterValues, presets])

  const handleParamValuesChange = useCallback(
    (_presetId: string, values: ExtractValuesFromParametersOptions<ParamsOptions> | null) => {
      setParameterValues(values)
    },
    [setParameterValues],
  )

  return (
    <ParameterControlsContextProvider
      parameters={parameters}
      presets={presets}
      onChange={handleParamValuesChange}
      onLocationUpdate={onLocationUpdate}
    >
      {children}
    </ParameterControlsContextProvider>
  )
}

function useValidateRender(
  render: DesignRender<any>,
  extendValidationErrors: ExtendDesignValidationErrors,
) {
  useEffect(() => {
    if (render == null) return
    const errors: DesignValidationErrors = {}
    errors.meta = validateRenderKey(render, 'meta', designMetaSchema)
    errors.parameters = validateRenderKey(render, 'parameters', designParametersSchema)
    if (errors.parameters == null) {
      errors.presets = validateRenderKey(
        render,
        'presets',
        getDesignPresetsSchema(render.parameters),
      )
    }
    extendValidationErrors(errors)
  }, [render, extendValidationErrors])
}

function validateRenderKey(
  render: NonNullable<DesignRender<any>>,
  key: DesignValidationKey,
  schema: Zod.Schema,
): DesignValidationError {
  const result = schema.safeParse(render[key])
  if (result.success) return null
  return result.error
}
