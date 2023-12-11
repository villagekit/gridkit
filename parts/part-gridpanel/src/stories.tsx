import { Meta } from '@storybook/react/types-6-0'
import React from 'react'

import { GridPanelSvg } from './svg'

export default {
  title: 'parts/GridPanel',
} as Meta

export const gridPanelSvg = () => <GridPanelSvg sizeInGrids={[60, 30]} />
