import { FormControl, Select as SelectComponent } from '@villagekit/ui'
import { map } from 'lodash-es'
import { type ChangeEvent, useCallback } from 'react'
import { StringParam } from 'serialize-query-params'
import { z } from 'zod'
import { Label } from '../components/label'
import { type BaseProps, baseParameterSchema } from './base'

export const ChoiceId = 'choice'
export type ChoiceValue = string
export const choiceValueSchema = z.string()
export const ChoiceQueryParam = StringParam

export const choiceParameterSchema = baseParameterSchema.extend({
  type: z.literal(ChoiceId),
  options: z.record(z.string(), z.string()),
})
export type ChoiceParameter = z.infer<typeof choiceParameterSchema>

export type ChoiceProps = Omit<ChoiceParameter, 'type'> & BaseProps<ChoiceValue>

export function Choice(props: ChoiceProps) {
  const { id, onChange, value, label, description, options } = props

  const handleChange = useCallback(
    (ev: ChangeEvent<HTMLSelectElement>) => {
      onChange(ev.target.value)
    },
    [onChange],
  )

  return (
    <FormControl id={id}>
      <Label label={label} description={description} />

      <SelectComponent aria-label={label} value={value} onChange={handleChange}>
        {map(options, (label, value) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </SelectComponent>
    </FormControl>
  )
}
