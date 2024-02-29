import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useDesignRender } from './renders'
import { DesignFile, DesignInstance } from './types'
import {
  ExtractValuesFromParametersOptions,
  ParameterControlsContextProvider,
  ParametersOptions,
  Presets,
} from '@villagekit/parameters'

type ProviderProps = {
  children: React.ReactNode
}

type SandboxOptions = {
  file: DesignFile
  onLocationUpdate?: (location: Location) => void
}

type SandboxState = DesignInstance<any> | null

export const SandboxContext = createContext<SandboxState | null>(null)

export function useSandboxContext() {
  return useContext(SandboxContext)
}

export function SandboxProvider(props: SandboxOptions & ProviderProps) {
  const { file, onLocationUpdate, children } = props

  const renderOutput = useDesignRender(file)
  const render = renderOutput?.render
  const renderError = renderOutput?.error

  const parameters = renderOutput.render?.parameters
  const presets = renderOutput.render?.presets
  const hasParameters = parameters != null
  const hasPresets = presets != null

  const [parameterValues, setParameterValues] = useState<object | null>(null)

  const state = {
    file,
    render,
    renderError,
    parameters,
    presets,
    parameterValues,
  }

  return (
    <SandboxContext.Provider value={state}>
      {hasParameters && hasPresets ? (
        <SandboxParameters
          onLocationUpdate={onLocationUpdate}
          parameters={parameters}
          presets={presets}
          setParameterValues={setParameterValues}
        >
          {children}
        </SandboxParameters>
      ) : (
        children
      )}
    </SandboxContext.Provider>
  )
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
