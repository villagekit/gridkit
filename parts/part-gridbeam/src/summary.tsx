import {
  PartCount,
  PartsSummaryProps,
  partsToPartQuotas,
  PartSummaryEntry,
  PartSummaryQuota,
  useSummaryContext,
} from '@villagekit/part-base'
import { HStack, Text, VStack } from '@villagekit/ui'
import React, { memo, useMemo } from 'react'

import { GridBeamSummaryValue } from './'
import { calculateSummaryKey } from './methods'
import { SummaryGridBeamSvg } from './svg/summary-grid-beam-svg'

export const PartsSummary = memo(function PartsSummary(
  props: PartsSummaryProps<GridBeamSummaryValue>,
) {
  const { parts, ...restProps } = props

  const { groupParts } = useSummaryContext()

  const partQuotas = useMemo(() => {
    const partEntries = parts.map(
      (part: GridBeamSummaryValue): PartSummaryEntry<GridBeamSummaryValue> => [
        calculateSummaryKey(part),
        part,
      ],
    )
    const partQuotaType = groupParts ? 'grouped' : 'single'
    const partQuotas = partsToPartQuotas(partQuotaType, partEntries)

    return partQuotas.sort(
      ({ part: partA }, { part: partB }) =>
        partB.lengthInGrids - partA.lengthInGrids,
    )
  }, [parts, groupParts])

  return (
    <VStack
      as="section"
      aria-labelledby="gridbeam-parts-summary-header"
      alignItems="flex-start"
      width="full"
    >
      <Text id="gridbeam-parts-summary-header" sx={{ fontWeight: 'bold' }}>
        Beams
      </Text>

      <VStack role="list" width="full">
        {partQuotas.map((quota, index) => (
          <PartSummary key={index} quota={quota} {...restProps} />
        ))}
      </VStack>
    </VStack>
  )
})

type PartSummaryProps = Omit<
  PartsSummaryProps<GridBeamSummaryValue>,
  'parts'
> & {
  quota: PartSummaryQuota<GridBeamSummaryValue>
}

const PartSummary = memo(function PartSummary(props: PartSummaryProps) {
  const { quota } = props
  const {
    part: { lengthInGrids },
  } = quota

  const { displayUnit } = useSummaryContext()

  return (
    <HStack
      role="listitem"
      alignItems="flex-start"
      spacing="4"
      sx={{ width: '100%' }}
    >
      {quota.type === 'grouped' && <PartCount count={quota.count} />}

      <SummaryGridBeamSvg
        sizeInGrids={lengthInGrids}
        displayUnit={displayUnit}
      />
    </HStack>
  )
})
