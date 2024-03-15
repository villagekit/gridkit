import { PartsGlForAll } from '@villagekit/part'
import { useEffect } from 'react'
import type { Box3 } from 'three'
import { useKitContext } from './context'

interface KitGlProps {
  setBoundingBox: (box: Box3) => void
}

export function KitGl(props: KitGlProps) {
  const { setBoundingBox } = props

  const { boundingBox, partValues: partGlValues } = useKitContext()

  useEffect(() => {
    setBoundingBox(boundingBox)
  }, [setBoundingBox, boundingBox])

  return <PartsGlForAll partGlValues={partGlValues} />
}
