import { InfoTooltip } from '@villagekit/ui'
import React from 'react'

import { useParameterControlsInternalContext } from '../internal-context'

interface HelperTooltipProps {
  label: string
}

export function HelperTooltip(props: HelperTooltipProps) {
  const { label } = props

  const { containerRef } = useParameterControlsInternalContext()

  return (
    <InfoTooltip label={label} portalProps={{ containerRef: containerRef }} />
  )
}
