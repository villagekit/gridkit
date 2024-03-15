import { Box, VStack } from '@villagekit/ui'
import { map, mapValues } from 'lodash-es'
import { useCallback } from 'react'
import { z } from 'zod'
import { useParameters, useParametersValues, useShowControls, useUpdateParametersValues } from '..'
import {
  // biome-ignore lint/suspicious/noShadowRestrictedNames:
  Boolean,
  BooleanId,
  BooleanQueryParam,
  type BooleanValue,
  booleanParameterSchema,
  booleanValueSchema,
} from './boolean'
import {
  Choice,
  ChoiceId,
  ChoiceQueryParam,
  type ChoiceValue,
  choiceParameterSchema,
  choiceValueSchema,
} from './choice'
import {
  // biome-ignore lint/suspicious/noShadowRestrictedNames:
  Number,
  NumberId,
  NumberQueryParam,
  type NumberValue,
  numberParameterSchema,
  numberValueSchema,
} from './number'

export const parameterSchema = z.discriminatedUnion('type', [
  booleanParameterSchema,
  choiceParameterSchema,
  numberParameterSchema,
])
export type Parameter = z.infer<typeof parameterSchema>

export type ParameterValuesByType = {
  [BooleanId]: BooleanValue
  [ChoiceId]: ChoiceValue
  [NumberId]: NumberValue
}

export const parameterValueSchemasByType = {
  [BooleanId]: booleanValueSchema,
  [ChoiceId]: choiceValueSchema,
  [NumberId]: numberValueSchema,
}

export const parameterValueSchema = z.union([
  booleanValueSchema,
  choiceValueSchema,
  numberValueSchema,
])

export type ParameterValue = BooleanValue | ChoiceValue | NumberValue
export type ParametersValues = Record<string, ParameterValue>

export const parameterQueryParamsByType = {
  [BooleanId]: BooleanQueryParam,
  [ChoiceId]: ChoiceQueryParam,
  [NumberId]: NumberQueryParam,
}

export type Parameters = {
  [Id: string]: Parameter
}

export const parametersSchema = z.record(z.string(), parameterSchema)

export type ExtractValueFromParameter<Param extends Parameter> =
  ParameterValuesByType[Param['type']]

export type ExtractValuesFromParameters<Params extends Parameters> = {
  [Key in keyof Params]: ExtractValueFromParameter<Params[Key]>
}

export function extractValueSchemaFromParameter<Param extends Parameter>(parameter: Param) {
  return parameterValueSchemasByType[parameter.type]
}
export function extractValuesSchemaFromParameters<Params extends Parameters>(parameters: Params) {
  return z.object(mapValues(parameters, extractValueSchemaFromParameter))
}

export function ParameterValueControls() {
  const parameters = useParameters()
  const values = useParametersValues()
  const updateParametersValues = useUpdateParametersValues()
  const showControls = useShowControls()

  if (!showControls) return null
  if (values == null) return null

  const setValue = useCallback(
    <Key extends keyof typeof values>(key: Key, value: (typeof values)[Key]) => {
      const nextValues = Object.assign({}, values, {
        [key]: value,
      })
      updateParametersValues(nextValues)
    },
    [values, updateParametersValues],
  )

  return (
    <Box role="menu" sx={{ width: '100%' }}>
      <VStack spacing="4">
        {map(parameters, (parameter, id) => (
          <ParameterValueControl<typeof id, typeof parameters, typeof parameter>
            key={id}
            id={id}
            parameter={parameter}
            values={values}
            setValue={setValue}
          />
        ))}
      </VStack>
    </Box>
  )
}

export interface ParameterValueControlProps<
  Id extends string,
  Params extends Parameters,
  Param extends Parameter,
> {
  id: Id
  parameter: Param
  values: ExtractValuesFromParameters<Params>
  setValue: (id: Id, value: ExtractValueFromParameter<Param>) => void
}

function ParameterValueControl<
  Id extends string,
  Params extends Parameters,
  Param extends Parameter,
>(props: ParameterValueControlProps<Id, Params, Param>) {
  const { id, parameter, setValue, values } = props

  const handleChange = useCallback(
    (value: ExtractValueFromParameter<Param>) => {
      setValue(id, value)
    },
    [id, setValue],
  )

  switch (parameter.type) {
    case 'boolean': {
      return (
        <Boolean
          {...parameter}
          id={id}
          value={values[id] as BooleanValue}
          onChange={handleChange as (value: BooleanValue) => void}
        />
      )
    }
    case 'choice': {
      return (
        <Choice
          {...parameter}
          id={id}
          value={values[id] as ChoiceValue}
          onChange={handleChange as (value: ChoiceValue) => void}
        />
      )
    }
    case 'number': {
      return (
        <Number
          {...parameter}
          id={id}
          value={values[id] as NumberValue}
          onChange={handleChange as (value: NumberValue) => void}
        />
      )
    }
  }
}
