import { LabelX, SvgContextProvider } from '@villagekit/part/base/grid'
import { Box, useTheme } from '@villagekit/ui'
import { useMemo } from 'react'

import { BeamSvg } from './beam-svg'
import { CutMarker } from './cut-marker'

const GRID_SPACING = 40

const DEFAULT_CANVAS_SIZE_IN_GRIDS = 60

interface CutGridBeamSvgProps {
  sizeInGrids: number
  cuts: Array<number>
  remainder: number
  displayUnit?: 'gu' | 'mm'
  /**
   * Grid units the drawing is scaled against, so a beam shorter than the canvas draws
   * proportionally short. Pass the longest beam in a list to keep the whole list to one scale;
   * it is only ever widened to fit this beam, never narrowed below it.
   */
  canvasSizeInGrids?: number
}

export function CutGridBeamSvg(props: CutGridBeamSvgProps) {
  const {
    cuts,
    sizeInGrids,
    remainder,
    displayUnit = 'gu',
    canvasSizeInGrids = DEFAULT_CANVAS_SIZE_IN_GRIDS,
  } = props

  const beamWidth = GRID_SPACING * sizeInGrids
  const beamHeight = GRID_SPACING
  const remainderWidth = GRID_SPACING * remainder
  // Never narrower than the beam: stock longer than the canvas is legal — a cutting planner can be
  // given custom-length stock — and would otherwise draw off the right edge, taking the remainder
  // and the total label with it.
  const maxBeamWidth = GRID_SPACING * Math.max(canvasSizeInGrids, sizeInGrids)

  const absoluteCuts = useMemo(() => {
    let sum = 0
    return cuts
      .map((cut) => {
        sum += cut
        return sum
      })
      .filter((cut) => cut !== sizeInGrids)
  }, [cuts, sizeInGrids])

  const label = useMemo(() => {
    if (displayUnit === 'gu') {
      return `${joinAnd(
        cuts,
      )} unit grid beams made from a ${sizeInGrids} unit grid beam cut at ${joinAnd(
        absoluteCuts,
      )} grid unit markers.`
    }
    return `${joinAnd(
      cuts.map((cut) => cut * GRID_SPACING),
    )} millimeter grid beams made from a ${beamWidth} millimeter grid beam cut at ${joinAnd(
      absoluteCuts.map((cut) => cut * GRID_SPACING),
    )} millimeter markers.`
  }, [displayUnit, beamWidth, cuts, absoluteCuts, sizeInGrids])

  const system = useTheme()
  const labelColor = system.token('colors.gray.400')

  return (
    <SvgContextProvider displayUnit={displayUnit}>
      <Box css={{ width: '100%' }}>
        <svg
          role="img"
          aria-label={label}
          width="100%"
          viewBox={`-4 0 ${maxBeamWidth + GRID_SPACING} ${beamHeight * 2}`}
          xmlns={'http://www.w3.org/2000/svg'}
        >
          <title>{label}</title>

          {cuts.map((cut, index) => (
            <BeamSvg
              // biome-ignore lint/suspicious/noArrayIndexKey: position in the beam is the identity
              key={index}
              sizeInGrids={cut}
              x={(absoluteCuts[index - 1] || 0) * GRID_SPACING}
              showSizeMarker
              showShadow
              minHolesForSizeMarker={4}
              shouldPadEnds
            />
          ))}

          {remainderWidth > 0 && (
            <BeamSvg
              sizeInGrids={remainder}
              x={beamWidth - remainderWidth}
              showSizeMarker
              showShadow
              minHolesForSizeMarker={4}
              shouldPadEnds
              isGrayscale
            />
          )}

          {absoluteCuts.map((cut, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: a zero-length cut repeats the position
            <CutMarker key={index} cut={cut} />
          ))}

          <g transform={`translate(0, ${GRID_SPACING})`}>
            <LabelX value={sizeInGrids} color={labelColor} x={beamWidth} />
          </g>
        </svg>
      </Box>
    </SvgContextProvider>
  )
}

function joinAnd(strs: Array<string | number>): string {
  if (strs.length === 0) return ''
  if (strs.length === 1) return `${strs[0]}`
  if (strs.length === 2) return `${strs[0]} and ${strs[1]}`
  return `${strs.slice(0, strs.length - 1).join(', ')}, and ${String(strs.at(-1))}`
}
