import { FormControl, FormLabel, Select } from '@villagekit/ui'
import { find } from 'lodash-es'
import { type ChangeEvent, useCallback } from 'react'
import { z } from 'zod'
import {
  type ExtractValuesFromParameters,
  type Parameters,
  extractValuesSchemaFromParameters,
  usePresetId,
  usePresets,
  useUpdateParametersValues,
  useUpdatePresetId,
} from '../'

export interface Preset<Params extends Parameters> {
  id: string
  label: string
  values: ExtractValuesFromParameters<Params>
}

export function getPresetValuesSchema<Params extends Parameters>(
  parameters: Params,
) {
  return extractValuesSchemaFromParameters(parameters)
}

export function getPresetSchema<Params extends Parameters>(
  parameters: Params,
) {
  return z.object({
    id: z.string(),
    label: z.string(),
    values: getPresetValuesSchema(parameters),
  })
}

export type Presets<Params extends Parameters> = [
  Preset<Params>,
  ...Array<Preset<Params>>,
]

export function Presets<Params extends Parameters>(
  presets: Presets<Params>,
): Presets<Params> {
  return presets
}

export function getPresetsSchema<Params extends Parameters>(
  parameters: Params,
) {
  const presetSchema = getPresetSchema(parameters)
  return z.array(presetSchema).min(1)
}

export function PresetControls() {
  const presetId = usePresetId()
  const presets = usePresets()
  const updatePresetId = useUpdatePresetId()
  const updateParametersValues = useUpdateParametersValues()

  const handlePresetChange = useCallback(
    (ev: ChangeEvent<HTMLSelectElement>) => {
      const selectedPresetId = ev.target.value
      if (selectedPresetId === 'custom') {
        const preset = find(presets, ['id', presetId])
        if (preset == null) return
        updateParametersValues(preset.values)
      } else {
        updatePresetId(selectedPresetId)
      }
    },
    [updatePresetId, updateParametersValues, presets, presetId],
  )

  return (
    <FormControl id="preset" role="group">
      <FormLabel>Preset</FormLabel>

      <Select role="menuitem" value={presetId || 'custom'} onChange={handlePresetChange}>
        {presets.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.label}
          </option>
        ))}

        <option value="custom">Custom</option>
      </Select>
    </FormControl>
  )
}
