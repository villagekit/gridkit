import { createActorContext } from '@xstate/react'

import { MachineInput, parametersMachine } from './machine'
import React, { useEffect } from 'react'

const ParametersMachineContext = createActorContext(parametersMachine)

type ParametersProviderProps = MachineInput & { children: React.ReactNode }

export function ParametersProvider(props: ParametersProviderProps) {
  const { children, ...input } = props

  return (
    <ParametersMachineContext.Provider options={{ input }}>
      <HandleInputChange input={input} />
      {children}
    </ParametersMachineContext.Provider>
  )
}

function HandleInputChange(props: { input: MachineInput }) {
  const { input } = props
  const actorRef = ParametersMachineContext.useActorRef()

  useEffect(() => {
    actorRef.send({ type: 'updateInput', ...input })
  }, [input])

  return <React.Fragment />
}

export function useParameters
