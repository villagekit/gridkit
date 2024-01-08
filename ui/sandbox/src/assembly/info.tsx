import { useDesignContext } from '@villagekit/design'
import {
  Heading,
  HStack,
  InfoTooltip,
  ListItem,
  Spinner,
  Text,
  UnorderedList,
  VStack,
} from '@villagekit/ui'
import { convert, meter, millimeter } from '@villagekit/util-units'
import * as dnum from 'dnum'
import React, { useMemo } from 'react'
import { Vector3 } from 'three'

interface AssemblyInfoProps {
  containerRef?: React.RefObject<HTMLElement | null>
}

export function AssemblyInfo(props: AssemblyInfoProps) {
  const { containerRef } = props

  const { boundingBox, estimatedPrice, isLoading } = useDesignContext()

  const dimensionsInMillimeters = useMemo(
    () =>
      boundingBox
        .getSize(new Vector3())
        .toArray()
        .map(
          (value) =>
            ({
              type: 'quantity',
              unit: meter,
              value,
            }) as const,
        )
        .map((dimensionInMeters) => Math.floor(convert(dimensionInMeters, millimeter).value)),
    [boundingBox],
  )

  return (
    <HStack
      as="section"
      aria-label="Design information"
      justifyContent="center"
      spacing="8"
      sx={{ width: '100%' }}
    >
      <HStack as="section" aria-label="Estimated price" alignItems="flex-start">
        <VStack sx={{ textAlign: 'center' }}>
          <Text>Estimated Price</Text>

          {isLoading ? (
            <Spinner colorScheme="primary" />
          ) : (
            <Heading size="md" sx={{ color: 'primary.400' }}>
              ${dnum.format(estimatedPrice.total)}
            </Heading>
          )}
        </VStack>
        <InfoTooltip
          label={
            <VStack alignItems="flex-start">
              <Text sx={{ color: 'white' }}>Estimated price breakdown:</Text>
              <UnorderedList sx={{ paddingLeft: 4 }}>
                <ListItem>Grid beams: ${dnum.format(estimatedPrice.gridbeam)}</ListItem>
                <ListItem>Grid panels: ${dnum.format(estimatedPrice.gridpanel)}</ListItem>
                {/*
                <ListItem>
                  Fasteners: ${dnum.format(estimatedPrice.fastener)}
                </ListItem>
                */}
              </UnorderedList>
              <Text sx={{ color: 'white' }}>
                Estimated price is automatically caclulated based on the selected preset and
                customisations.
              </Text>
              <Text sx={{ color: 'white' }}>
                The estimated price is not (yet) indicative of actual checkout price, due to parts
                being sold as bundles.
              </Text>
            </VStack>
          }
          pointerTimeout={5000}
          portalProps={{ containerRef: containerRef }}
          sx={{ fontSize: 'sm', padding: 4 }}
        />
      </HStack>

      <HStack as="section" aria-label="Assembled dimensions" alignItems="flex-start">
        <VStack sx={{ textAlign: 'center' }}>
          <Text>Assembled Dimensions</Text>

          <Text sx={{ fontStyle: 'italic' }}>
            {dimensionsInMillimeters[0]} x {dimensionsInMillimeters[1]} x{' '}
            {dimensionsInMillimeters[2]}mm
          </Text>
        </VStack>

        <InfoTooltip
          label={
            <VStack alignItems="flex-start">
              <Text sx={{ color: 'white', fontStyle: 'italic' }}>Width x Depth x Height</Text>
              <Text sx={{ color: 'white' }}>
                Dimensions are automatically caclulated based on the selected preset and
                customisations.
              </Text>
            </VStack>
          }
          pointerTimeout={3000}
          portalProps={{ containerRef: containerRef }}
          sx={{ fontSize: 'sm', padding: 4 }}
        />
      </HStack>
    </HStack>
  )
}
