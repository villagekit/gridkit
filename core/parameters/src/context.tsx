import { createActorContext } from '@xstate/react'

import { ParametersInput, parametersMachine } from './machine'
import React, { useCallback, useEffect } from 'react'
import { ParametersValues } from '.'

const ParametersMachineContext = createActorContext(parametersMachine)

type Optional<T> = { [K in keyof T]: T[K] | null | undefined }
type ParametersProviderProps = Omit<ParametersInput, 'parameters' | 'presets'> &
  Optional<Pick<ParametersInput, 'parameters' | 'presets'>> & {
    onParametersValuesUpdate: (parametersValues: ParametersValues) => void
    children: React.ReactNode
  }

export function ParametersProvider(props: ParametersProviderProps) {
  const { children, parameters, presets, onParametersValuesUpdate, onLocationUpdate } = props

  if (parameters == null) return children
  if (presets == null) return children

  const input = { parameters, presets, onLocationUpdate }

  return (
    <ParametersMachineContext.Provider options={{ input }}>
      <UpdateInput {...input} />
      <NotifyContextChange useValue={useParametersValues} onChange={onParametersValuesUpdate} />
      {children}
    </ParametersMachineContext.Provider>
  )
}

type NotifyContextChangeProps<T> = {
  useValue: () => T
  onChange: (value: T) => void
}

function NotifyContextChange<T>(props: NotifyContextChangeProps<T>) {
  const { useValue, onChange } = props

  const value = useValue()
  useEffect(() => {
    onChange(value)
  }, [onChange, value])

  return <React.Fragment />
}

function UpdateInput(props: ParametersInput) {
  const { parameters, presets, onLocationUpdate } = props
  const actorRef = ParametersMachineContext.useActorRef()

  useEffect(() => {
    actorRef.send({ type: 'updateInput', parameters, presets, onLocationUpdate })
  }, [actorRef, parameters, presets, onLocationUpdate])

  return <React.Fragment />
}

export function useHasParameters() {
  try {
    ParametersMachineContext.useActorRef()
    return true
  } catch (err) {
    return false
  }
}

export function useParameters() {
  return ParametersMachineContext.useSelector(({ context }) => context.parameters)
}

export function usePresets() {
  return ParametersMachineContext.useSelector(({ context }) => context.presets)
}

export function usePresetId() {
  return ParametersMachineContext.useSelector(({ context }) => context.presetId)
}

export function useParametersValues() {
  return ParametersMachineContext.useSelector(({ context }) => context.parametersValues)
}

export function useShowControls() {
  return ParametersMachineContext.useSelector(({ context }) => context.showControls)
}

export function useSetShowControls() {
  const actorRef = ParametersMachineContext.useActorRef()
  return useCallback(
    (showControls: boolean) => actorRef.send({ type: 'setShowControls', showControls }),
    [actorRef],
  )
}

export function useUpdatePresetId() {
  const actorRef = ParametersMachineContext.useActorRef()
  return useCallback(
    (presetId: string) => actorRef.send({ type: 'updatePresetId', presetId }),
    [actorRef],
  )
}

export function useUpdateParametersValues() {
  const actorRef = ParametersMachineContext.useActorRef()
  return useCallback(
    (parametersValues: ParametersValues) =>
      actorRef.send({ type: 'updateParametersValues', parametersValues }),
    [actorRef],
  )
}
