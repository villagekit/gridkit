import { Meta } from '@storybook/react/types-6-0'
import React from 'react'

import { GridBeamSvg } from './svg'

export default {
  title: 'parts/GridBeam',
} as Meta

export const gridBeamSvg = () => <GridBeamSvg sizeInGrids={60} />
