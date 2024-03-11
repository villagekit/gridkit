import { parse as parseQueryString } from 'query-string'
import React, {
  ChangeEvent,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  BooleanParam,
  DecodedValueMap,
  decodeQueryParams,
  encodeQueryParams,
  NumberParam,
  QueryParamConfigMap,
  StringParam,
  updateLocation,
  withDefault,
} from 'serialize-query-params'
import { useDebouncedCallback } from 'use-debounce'

import { Preset, Presets } from './presets'
import {
  ExtractValuesFromParametersOptions,
  ParameterOptions,
  ParametersOptions,
  ParametersValues,
} from './values'
import { assign, fromCallback, setup } from 'xstate'
import { intersection } from 'lodash-es'

// xstate notes
//
// parameter controls machine
// - input
//   - parameters
//   - presets
//  - emitted
//    - change
//    - location-update
// - context
//   - currentPresetId
//   - currentParameterValues
//   - showControls
//   - setShowControls
//   - changePreset
//   - changeCustomValues
//
// parameter values machine
// - parallel state: parameter value machine

const updateQueryParamsActor = fromCallback(({ input, receive }) => {
  receive(event => {
  })

  return () => {}
})

const parametersMachine = setup({
  types: {} as {
    input: {
      parameters: ParametersOptions
      presets: Presets<any>
    }
    context: {
      parameters: ParametersOptions
      presets: Presets<any>
      queryParameterDefinitions: QueryParamConfigMap
      presetId: string | null
      parametersValues: ParametersValues | null
      showControls: boolean
    }
    events:
      | {
          type: 'changeInput'
          parameters: ParametersOptions
          presets: Presets<any>
        }
      | {
          type: 'changePresetId'
          presetId: string
        }
      | {
          type: 'changeParametersValues'
          parametersValues: ParametersValues
        }
      | {
          type: 'toggleControls'
        }
    emitted:
      | {
          type: 'change'
          presetId: string
          parametersValues: ParametersValues
        }
      | {
          type: 'locationUpdate'
        }
    actions: {
      type: 'calculateQueryParameterDefinitions'
    }
  },
}).createMachine({
  state: {
    loading: {
    },
    loaded: {
      invoke: {
        src:
      }
    }
  }
  context: ({ input }) => {
    const { parameters, presets } = input
    assertPresets(parameters, presets)
    const defaultPreset = presets[0]
    const queryParameterDefinitions = calculateQueryParameterDefinitions(parameters, defaultPreset)
    return {
      parameters,
      presets,
      presetId: defaultPreset.id,
      queryParameterDefinitions,
      parametersValues: null,
      showControls: false,
    }
  },
  on: {
    changeInput: {
      actions: assign(({ context, event }) => {
        const { parameters, presets } = event
        assertPresets(parameters, presets)
        const defaultPreset = presets[0]
        const queryParameterDefinitions = calculateQueryParameterDefinitions(
          parameters,
          defaultPreset,
        )
        return {
          ...context,
          parameters,
          presets,
          queryParameterDefinitions,
        }
      }),
    },
    changePresetId: {
      actions: assign(({ context, event }) => {
      })
    }
  },
})

function assertPresets<ParamsOptions extends ParametersOptions>(
  parameters: ParamsOptions,
  presets: Presets<any>,
): asserts presets is Presets<ParamsOptions> {
  const paramKeys = Object.keys(parameters)
  const presetKeys = Object.keys(presets[0].values)
  if (
    !(
      paramKeys.length === presetKeys.length &&
      intersection(paramKeys, presetKeys).length === paramKeys.length
    )
  ) {
    throw new Error('presets are not valid for parameters')
  }
}

function calculateQueryParameterDefinitions<ParamsOptions extends ParametersOptions>(
  parameters: ParamsOptions,
  defaultPreset: Preset<ParamsOptions>,
): QueryParamConfigMap {
  const queryPresetConfig = {
    preset: withDefault(StringParam, defaultPreset.id),
  }

  const queryParamConfigForParameter = (parameterKey: string, parameter: ParameterOptions) => {
    switch (parameter.type) {
      case 'boolean':
        return withDefault(BooleanParam, defaultPreset.values[parameterKey] as boolean)
      case 'choice':
        return withDefault(StringParam, defaultPreset.values[parameterKey] as string)
      case 'number':
        return withDefault(NumberParam, defaultPreset.values[parameterKey] as number)
    }
  }

  const queryParamsConfig = Object.keys(parameters).reduce<QueryParamConfigMap>(
    (sofar, parameterKey) => {
      const parameter = parameters[parameterKey]
      if (parameter === undefined) throw new Error('parameter is undefined')

      sofar[parameter.shortId || parameterKey] = queryParamConfigForParameter(
        parameterKey,
        parameter,
      )

      return sofar
    },
    {},
  )

  return {
    ...queryPresetConfig,
    ...queryParamsConfig,
  }
}

function mapValuesToQueryValueMap<ParamsOptions extends ParametersOptions>(
  parameters: ParamsOptions,
  values: ExtractValuesFromParametersOptions<ParamsOptions>,
): DecodedValueMap<QueryParamConfigMap> {
  return Object.keys(parameters).reduce<DecodedValueMap<QueryParamConfigMap>>(
    (sofar, parameterKey) => {
      const parameter = parameters[parameterKey]
      if (parameter === undefined) throw new Error('parameter is undefined')

      sofar[parameter.shortId || parameterKey] = values[parameterKey]
      return sofar
    },
    {},
  )
}

function mapQueryValueMapToValues<ParamsOptions extends ParametersOptions>(
  parameters: ParamsOptions,
  values: DecodedValueMap<QueryParamConfigMap>,
): ExtractValuesFromParametersOptions<ParamsOptions> {
  return Object.keys(parameters).reduce<DecodedValueMap<QueryParamConfigMap>>(
    (sofar, parameterKey) => {
      const parameter = parameters[parameterKey]
      if (parameter === undefined) throw new Error('parameter is undefined')

      sofar[parameterKey] = values[parameter.shortId || parameterKey]
      return sofar
    },
    {},
  ) as ExtractValuesFromParametersOptions<ParamsOptions>
}

export interface ParameterControlsContextProps<ParamsOptions extends ParametersOptions,> {
  parameters: ParamsOptions
  presets: Presets<ParamsOptions>
  onChange?: (
    presetId: string,
    values: ExtractValuesFromParametersOptions<ParamsOptions> | null,
  ) => void
  onLocationUpdate?: (location: Location) => void
}

interface ParameterControlsContextType<ParamsOptions extends ParametersOptions>
  extends ParameterControlsContextProps<ParamsOptions> {
  currentPresetId: string
  currentValues: ExtractValuesFromParametersOptions<ParamsOptions> | null
  showControls: boolean
  handleSetShowControls: (ev: ChangeEvent<HTMLInputElement>) => void
  handlePresetChange: (presetId: string) => void
  handleCustomValuesChange: (values: ExtractValuesFromParametersOptions<ParamsOptions>) => void
  updateStateFromQueryParams: () => void
}

// Note that ParameterControlsContext is uncontrolled and manages it's own state, but emits value change information to
// it's parent via the onChange callback prop.
function useParameters<ParamsOptions extends ParametersOptions>(
  props: ParameterControlsContextProps<ParamsOptions>,
): ParameterControlsContextType<ParamsOptions> {
  const { parameters, presets, onChange, onLocationUpdate } = props

  type CustomValues = ExtractValuesFromParametersOptions<typeof parameters>

  const [currentPresetId, setCurrentPresetId] = useState(presets[0].id)
  const [customValues, setCustomValues] = useState<CustomValues | null>(null)
  const [showControls, setShowControls] = useState(false)

  const defaultPreset = presets[0]
  const currentPreset = useMemo(() => {
    return presets.find((preset) => preset.id === currentPresetId)
  }, [presets, currentPresetId])

  const currentValues = useMemo(() => {
    if (currentPresetId === 'custom') return customValues

    return currentPreset?.values || null
  }, [currentPresetId, currentPreset, customValues])

  const handleSetShowControls = useCallback((ev: ChangeEvent<HTMLInputElement>) => {
    setShowControls(ev.target.checked)
  }, [])

  const handlePresetChange = useCallback(
    (presetId: string) => {
      if (presetId === 'custom') {
        if (customValues == null) {
          setCustomValues(currentPreset?.values || null)
        }
        setShowControls(true)
      }

      setCurrentPresetId(presetId)
    },
    [customValues, currentPreset],
  )

  const handleCustomValuesChange = useCallback((values: CustomValues) => {
    setCustomValues(values)
    setCurrentPresetId('custom')
  }, [])

  // Update parent state
  useEffect(() => {
    if (onChange == null) return
    if (currentValues == null) return

    onChange(currentPresetId, currentValues)
  }, [onChange, currentPresetId, currentValues])

  const getQueryParamsValues = useCallback(() => {
    const urlParams = parseQueryString(location.search)
    const queryValues = decodeQueryParams(queryParameterDefinitions, urlParams)

    const { preset: presetId, ...queryParameterValues } = queryValues

    return { presetId, values: mapQueryValueMapToValues(queryParameterValues) }
  }, [queryParameterDefinitions, mapQueryValueMapToValues])

  const updateStateFromQueryParams = useCallback(() => {
    const { presetId, values } = getQueryParamsValues()

    setCurrentPresetId(presetId)
    setCustomValues(values)
  }, [getQueryParamsValues])

  const hasLoadedInitialQueryParams = useRef(false)

  useEffect(() => {
    if (hasLoadedInitialQueryParams.current === true) return

    updateStateFromQueryParams()

    hasLoadedInitialQueryParams.current = true
  }, [updateStateFromQueryParams])

  type UpdateQueryParamsState = {
    hasLoadedInitialQueryParams: typeof hasLoadedInitialQueryParams.current
    customValues: typeof customValues
    queryParameterDefinitions: typeof queryParameterDefinitions
    currentPresetId: typeof currentPresetId
    mapValuesToQueryValueMap: typeof mapValuesToQueryValueMap
    getQueryParamsValues: typeof getQueryParamsValues
    onLocationUpdate: typeof onLocationUpdate
  }
  const updateQueryParamsFromStateDebounced = useDebouncedCallback(
    ({
      hasLoadedInitialQueryParams,
      customValues,
      queryParameterDefinitions,
      currentPresetId,
      mapValuesToQueryValueMap,
      getQueryParamsValues,
      onLocationUpdate,
    }: UpdateQueryParamsState) => {
      if (hasLoadedInitialQueryParams === false) return

      if (customValues === null || onLocationUpdate == null) return

      const urlParams = encodeQueryParams(queryParameterDefinitions, {
        preset: currentPresetId,
        ...(currentPresetId === 'custom' ? mapValuesToQueryValueMap(customValues) : {}),
      })

      const { presetId: currentQueryPresetId, values: currentQueryValues } = getQueryParamsValues()

      if (currentPresetId !== currentQueryPresetId || !isEqual(customValues, currentQueryValues)) {
        const nextLocation = updateLocation(urlParams, location)
        onLocationUpdate(nextLocation)
      }
    },
    1000,
    {
      leading: false,
      trailing: true,
    },
  )
  useEffect(() => {
    updateQueryParamsFromStateDebounced({
      hasLoadedInitialQueryParams: hasLoadedInitialQueryParams.current,
      customValues,
      queryParameterDefinitions,
      currentPresetId,
      mapValuesToQueryValueMap,
      getQueryParamsValues,
      onLocationUpdate,
    })
  }, [
    updateQueryParamsFromStateDebounced,
    customValues,
    queryParameterDefinitions,
    currentPresetId,
    mapValuesToQueryValueMap,
    getQueryParamsValues,
    onLocationUpdate,
  ])

  return {
    ...props,
    currentPresetId,
    currentValues,
    handleCustomValuesChange,
    handlePresetChange,
    handleSetShowControls,
    showControls,
    updateStateFromQueryParams,
  }
}

// Manually setting up the context here instead of using constate
// so that we get better type inference on the exported provider and hook.
// This is because you cannot specify generic type parameters for higher
// order functions such as constate(...), or forwardRef(...)
// Ref: https://fettblog.eu/typescript-react-generic-forward-refs/
export const ParameterControlsContext = createContext<any>(null)

interface ParameterControlsContextProviderProps<ParamsOptions extends ParametersOptions,>
  extends ParameterControlsContextProps<ParamsOptions> {
  children: React.ReactNode | Array<React.ReactNode>
}

export function ParameterControlsContextProvider<ParamsOptions extends ParametersOptions,>(
  props: ParameterControlsContextProviderProps<ParamsOptions>,
) {
  const { children, ...rest } = props

  const value = useParameters(rest)

  return (
    <ParameterControlsContext.Provider value={value}>{children}</ParameterControlsContext.Provider>
  )
}

export function useParameterControlsContext<
  ParamsOptions extends ParametersOptions,
>(): ParameterControlsContextType<ParamsOptions> {
  return useContext(ParameterControlsContext)
}
