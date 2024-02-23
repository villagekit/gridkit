import { createContext, useCallback, useContext, useState } from 'react'
import { RenderOutput, useDesignRender } from './renders'
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

type SandboxRenderOptions = {
  file: DesignFile
}

type SandboxRenderState = RenderOutput<any>

function useSandboxRender(options: SandboxRenderOptions): SandboxRenderState {
  const { file } = options
  return useDesignRender(file)
}

const SandboxRenderContext = createContext<SandboxRenderState | null>(null)

type SandboxParametersOptions<ParamsOptions extends ParametersOptions> = {
  parameters: ParamsOptions
  presets: Presets<ParamsOptions>
}

type SandboxParametersState<ParamsOptions extends ParametersOptions> = {
  parameterValues: ExtractValuesFromParametersOptions<ParamsOptions> | null
  handleParamValuesChange: (
    presetId: string,
    parameterValues: ExtractValuesFromParametersOptions<ParamsOptions> | null,
  ) => void
}

function useParameters<ParamsOptions extends ParametersOptions>(
  options: SandboxParametersOptions<ParamsOptions>,
): SandboxParametersState<ParamsOptions> {
  const { parameters: _parameters, presets } = options
  const [parameterValues, setParameterValues] =
    useState<ExtractValuesFromParametersOptions<ParamsOptions> | null>(presets[0].values)
  const handleParamValuesChange = useCallback(
    (_presetId: string, values: ExtractValuesFromParametersOptions<ParamsOptions> | null) => {
      setParameterValues(values)
    },
    [],
  )
  return { handleParamValuesChange, parameterValues }
}

const SandboxParametersContext = createContext<SandboxParametersState<any> | null>(null)

type SandboxOptions = {
  file: DesignFile
  onLocationUpdate?: (location: Location) => void
}

type SandboxState = DesignInstance<any> | null

export function useSandboxContext(): SandboxState {
  const sandboxState = useContext(SandboxContext)
  const renderState = useContext(SandboxRenderContext)
  const parametersState = useContext(SandboxParametersContext)

  if (sandboxState == null) return null
  const { file } = sandboxState
  if (renderState == null) return null
  const { render, error: renderError } = renderState
  if (parametersState == null) return null
  const { parameterValues } = parametersState

  return {
    file,
    render,
    renderError,
    parameterValues,
  }
}

type SandboxContextState = {
  file: DesignFile
}

const SandboxContext = createContext<SandboxContextState | null>(null)

export function SandboxProvider(props: SandboxOptions & ProviderProps) {
  const { file, onLocationUpdate, children } = props

  const renderOutput = useSandboxRender({ file })

  const parameters = renderOutput.render?.parameters
  const presets = renderOutput.render?.presets
  const hasParameters = parameters != null
  const hasPresets = presets != null

  return (
    <SandboxContext.Provider value={{ file }}>
      <SandboxRenderContext.Provider value={renderOutput}>
        {hasParameters && hasPresets ? (
          <SandboxParametersProvider
            onLocationUpdate={onLocationUpdate}
            parameters={parameters}
            presets={presets}
          >
            {children}
          </SandboxParametersProvider>
        ) : (
          children
        )}
      </SandboxRenderContext.Provider>
    </SandboxContext.Provider>
  )
}

function SandboxParametersProvider<ParamsOptions extends ParametersOptions>(
  props: Pick<SandboxOptions, 'onLocationUpdate'> &
    SandboxParametersOptions<ParamsOptions> &
    ProviderProps,
) {
  const { onLocationUpdate, parameters, presets, children } = props

  const { parameterValues, handleParamValuesChange } = useParameters({ parameters, presets })

  return (
    <SandboxParametersContext.Provider value={{ parameterValues, handleParamValuesChange }}>
      <ParameterControlsContextProvider
        parameters={parameters}
        presets={presets}
        onChange={handleParamValuesChange}
        onLocationUpdate={onLocationUpdate}
      >
        {children}
      </ParameterControlsContextProvider>
    </SandboxParametersContext.Provider>
  )
}
