import { createActorContext } from '@xstate/react'

import { MachineInput, parametersMachine } from './machine'
import React, { useCallback, useEffect } from 'react'
import { ParametersValues } from '.'

const ParametersMachineContext = createActorContext(parametersMachine)

type ParametersProviderProps = MachineInput & { children: React.ReactNode }

export function ParametersProvider(props: ParametersProviderProps) {
  const { children, ...input } = props

  return (
    <ParametersMachineContext.Provider options={{ input }}>
      <UpdateInput input={input} />
      {children}
    </ParametersMachineContext.Provider>
  )
}

function UpdateInput(props: { input: MachineInput }) {
  const { input } = props
  const actorRef = ParametersMachineContext.useActorRef()

  useEffect(() => {
    actorRef.send({ type: 'updateInput', ...input })
  }, [actorRef, input])

  return <React.Fragment />
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
