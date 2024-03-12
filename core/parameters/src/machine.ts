import { parse as parseQueryString } from 'query-string'
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

import { Preset, Presets } from './presets'
import {
  ExtractValuesFromParametersOptions,
  ParameterOptions,
  ParametersOptions,
  ParametersValues,
} from './values'
import { assign, fromCallback, sendTo, setup } from 'xstate'
import { debounce, intersection, isEqual } from 'lodash-es'

export type OnLocationUpdate = (location: Location) => void
export type MachineInput = {
  parameters: ParametersOptions
  presets: Presets<any>
  onLocationUpdate?: OnLocationUpdate
}

type UpdatePresetIdEvent = {
  type: 'updatePresetId'
  presetId: string
}
type UpdateParametersValuesEvent = {
  type: 'updateParametersValues'
  parametersValues: ParametersValues
}
type UpdateStateEvent = UpdatePresetIdEvent | UpdateParametersValuesEvent
type UpdateInputEvent = { type: 'updateInput' } & MachineInput
type UpdateEvent = UpdateStateEvent | UpdateInputEvent

const queryParamsActor = fromCallback<UpdateEvent, MachineInput>(({ input, receive, sendBack }) => {
  let currentOnLocationUpdate: OnLocationUpdate | undefined
  let currentParameters: ParametersOptions
  let queryParameterDefinitions: QueryParamConfigMap

  setupInput(input)

  const handleUpdateDebounced = debounce(handleUpdateState, 1000, {
    leading: false,
    trailing: true,
  })

  receive((event) => {
    switch (event.type) {
      case 'updateInput': {
        const { parameters, presets, onLocationUpdate } = event
        return setupInput({ parameters, presets, onLocationUpdate })
      }
      case 'updatePresetId':
      case 'updateParametersValues':
        return handleUpdateDebounced(event)
    }
  })

  loadQueryParams()

  return () => {}

  function setupInput(input: MachineInput) {
    const { parameters, presets, onLocationUpdate } = input

    currentOnLocationUpdate = onLocationUpdate

    assertPresets(parameters, presets)
    currentParameters = parameters

    const defaultPreset = presets[0]
    queryParameterDefinitions = calculateQueryParameterDefinitions(parameters, defaultPreset)
  }

  function handleUpdateState(event: UpdateStateEvent) {
    const { presetId: currentQueryPresetId, values: currentQueryParametersValues } =
      getQueryParamsValues(currentParameters, queryParameterDefinitions)

    let urlParams
    switch (event.type) {
      case 'updatePresetId': {
        const { presetId } = event
        if (presetId === currentQueryPresetId) return
        urlParams = encodeQueryParams(queryParameterDefinitions, { preset: presetId })
        break
      }
      case 'updateParametersValues': {
        const { parametersValues } = event
        if (isEqual(parametersValues, currentQueryParametersValues)) return
        urlParams = encodeQueryParams(
          queryParameterDefinitions,
          mapValuesToQueryValueMap(currentParameters, parametersValues),
        )
        break
      }
    }

    if (currentOnLocationUpdate != null) {
      const nextLocation = updateLocation(urlParams, location)
      currentOnLocationUpdate(nextLocation)
    }
  }

  function loadQueryParams() {
    const { presetId, values } = getQueryParamsValues(currentParameters, queryParameterDefinitions)
    if (presetId != null) {
      sendBack({
        type: 'updatePresetId',
        presetId,
      })
    } else if (Object.keys(values).length > 0) {
      sendBack({
        type: 'updateParametersValues',
        parametersValues: values,
      })
    }
  }
})

export const parametersMachine = setup({
  types: {} as {
    input: MachineInput
    context: {
      parameters: ParametersOptions
      presets: Presets<any>
      onLocationUpdate?: OnLocationUpdate
      presetId: string | null
      parametersValues: ParametersValues
      showControls: boolean
    }
    events:
      | UpdateEvent
      | {
          type: 'setShowControls'
          showControls: boolean
        }
  },
  actors: {
    queryParams: queryParamsActor,
  },
}).createMachine({
  invoke: [
    {
      src: 'queryParams',
      input: ({ context: { parameters, presets, onLocationUpdate } }) => ({
        parameters,
        presets,
        onLocationUpdate,
      }),
    },
  ],
  context: ({ input }) => {
    const { parameters, presets, onLocationUpdate } = input
    assertPresets(parameters, presets)
    const defaultPreset = presets[0]
    return {
      parameters,
      presets,
      onLocationUpdate,
      presetId: defaultPreset.id,
      parametersValues: defaultPreset.values,
      showControls: false,
    }
  },
  on: {
    updateInput: {
      actions: [
        assign(({ context, event }) => {
          const { parameters, presets, onLocationUpdate } = event
          assertPresets(parameters, presets)
          // TODO assert presetId?
          // TODO assert parametersValues?
          return {
            ...context,
            parameters,
            presets,
            onLocationUpdate,
          }
        }),

        sendTo('queryParams', ({ event }) => event),
      ],
    },
    updatePresetId: {
      actions: [
        assign(({ context, event }) => {
          const { presets } = context
          const { presetId } = event
          const preset = presets.find((preset) => preset.id === presetId)
          return { ...context, presetId, parametersValues: preset?.values }
        }),
        sendTo('queryParams', ({ event }) => event),
      ],
    },
    updateParametersValues: {
      actions: [
        assign(({ context, event }) => {
          const { parametersValues } = event
          return { ...context, presetId: null, parametersValues }
        }),
        sendTo('queryParams', ({ event }) => event),
      ],
    },
    setShowControls: {
      actions: [
        assign({
          showControls: ({ event: { showControls } }) => showControls,
        }),
      ],
    },
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

function getQueryParamsValues<ParamsOptions extends ParametersOptions>(
  parameters: ParamsOptions,
  queryParameterDefinitions: QueryParamConfigMap,
) {
  const urlParams = parseQueryString(location.search)
  const queryValues = decodeQueryParams(queryParameterDefinitions, urlParams)

  const { preset: presetId, ...queryParameterValues } = queryValues

  return { presetId, values: mapQueryValueMapToValues(parameters, queryParameterValues) }
}
