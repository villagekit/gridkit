export * from './context'
export * from './presets'
export * from './values'

import { FormControl, FormLabel, HStack, Switch, VStack } from '@villagekit/ui'
import React, { useCallback } from 'react'

import { useParametersContext } from './context'
import { ParameterControlsInternalContextProvider } from './internal-context'
import { PresetControls } from './presets'
import { ParameterValueControls } from './values'

export interface ParameterControlsProps {
  containerRef?: React.RefObject<HTMLElement | null>
}

export function ParameterControls(props: ParameterControlsProps) {
  const { containerRef } = props

  const {
    parameters,
    presets,
    presetId,
    parametersValues,
    showControls,
    setShowControls,
    updatePresetId,
    updateParametersValues,
  } = useParametersContext()

  const handleShowControlsChange = useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      setShowControls(ev.target.checked)
    },
    [setShowControls],
  )

  return (
    <ParameterControlsInternalContextProvider containerRef={containerRef}>
      <VStack role="menubar" spacing="4" sx={{ width: '100%' }}>
        <HStack alignItems="baseline" spacing="4" sx={{ width: '100%' }}>
          <PresetControls presetId={presetId} presets={presets} onPresetChange={updatePresetId} />

          <FormControl sx={{ flex: 0 }}>
            <FormLabel htmlFor="show-controls">Controls</FormLabel>

            <Switch
              id="show-controls"
              role="menuitem"
              aria-haspopup="menu"
              aria-expanded={showControls}
              isChecked={showControls}
              onChange={handleShowControlsChange}
              sx={{ marginTop: 2.5 }}
            />
          </FormControl>
        </HStack>

        {showControls && parametersValues != null && (
          <ParameterValueControls
            parameters={parameters}
            values={parametersValues}
            onChange={updateParametersValues}
          />
        )}
      </VStack>
    </ParameterControlsInternalContextProvider>
  )
}
