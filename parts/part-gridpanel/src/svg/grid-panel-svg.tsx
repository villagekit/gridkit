import React from 'react'

import { GridPanelHoles } from '../types'
import { PanelSvg } from './panel-svg'

const GRID_SPACING = 40

interface GridPanelSvgProps {
  sizeInGrids: [number, number]
  holes?: GridPanelHoles
}

export function GridPanelSvg(props: GridPanelSvgProps) {
  const { sizeInGrids, holes } = props
  const [sizeInGridsX, sizeInGridsY] = sizeInGrids

  const panelWidth = GRID_SPACING * sizeInGridsX
  const panelHeight = GRID_SPACING * sizeInGridsY

  return (
    <svg
      width={`${panelWidth}mm`}
      height={`${panelHeight}mm`}
      viewBox={`0 0 ${panelWidth} ${panelHeight}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <PanelSvg sizeInGrids={sizeInGrids} holes={holes} />
    </svg>
  )
}
