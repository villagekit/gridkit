import { PartsGlForAll } from '@villagekit/part'
import { useEffect } from 'react'
import { Box3 } from 'three'
import { useSandboxContext } from '../context'
import { SandboxAssemblyProvider, useSandboxAssemblyContext } from './context'

interface AssemblyGlProps {
  setBoundingBox: (box: Box3) => void
}

export function AssemblyGl(props: AssemblyGlProps) {
  const context = useSandboxContext()
  if (context == null) return null

  const { render, parameterValues } = context
  if (render == null) return null

  return (
    <SandboxAssemblyProvider assembly={render} parameterValues={parameterValues}>
      <AssemblyGlWithContext {...props} />
    </SandboxAssemblyProvider>
  )
}

function AssemblyGlWithContext(props: AssemblyGlProps) {
  const { setBoundingBox } = props

  const { boundingBox, partValues: partGlValues } = useSandboxAssemblyContext()

  useEffect(() => {
    setBoundingBox(boundingBox)
  }, [setBoundingBox, boundingBox])

  return <PartsGlForAll partGlValues={partGlValues} />
}
