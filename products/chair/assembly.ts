import { DesignParameters, DesignMeta, DesignAssembly, DesignPresets } from '@villagekit/design'

export const meta: DesignMeta = {
  id: 'chair',
  name: 'Chair',
  description:
    'A conventional 4 legged chair. Useful for sitting at a desk, table, or to help you reach that top shelf.',
  categories: ['seating'],
}

export const parameters = {
  seatWidth: {
    label: 'Seat width',
    max: 10,
    min: 5,
    step: 5,
    type: 'number',
    queryParamId: 'sw',
  },
  seatDepth: {
    label: 'Seat depth',
    max: 15,
    min: 5,
    type: 'number',
    queryParamId: 'sd',
  },
  seatHeight: {
    helperText: 'The height from the ground to the top of the seat',
    label: 'Seat height',
    max: 15,
    min: 5,
    type: 'number',
    queryParamId: 'sh',
  },
  shouldIncludeBack: {
    label: 'Include back',
    type: 'boolean',
    queryParamId: 'b',
  },
  backHeight: {
    helperText: 'The height from the seat to the top of the backrest',
    label: 'Back height',
    max: 10,
    min: 5,
    type: 'number',
    queryParamId: 'bh',
  },
} satisfies DesignParameters

export const presets: DesignPresets<typeof parameters> = [
  {
    id: 'regular-with-back',
    name: 'Regular With Back',
    values: {
      backHeight: 10,
      seatDepth: 10,
      seatHeight: 10,
      seatWidth: 10,
      shouldIncludeBack: true,
    },
  },
  {
    id: 'regular',
    name: 'Regular (Without Back)',
    values: {
      backHeight: 10,
      seatDepth: 10,
      seatHeight: 10,
      seatWidth: 10,
      shouldIncludeBack: false,
    },
  },
]

export const assembly: DesignAssembly<typeof parameters> = (parameters) => {
  const { seatWidth, seatDepth, seatHeight, backHeight, shouldIncludeBack } = parameters

  const backZBeamEndZ = shouldIncludeBack ? seatHeight + backHeight : seatHeight
  const seatPanelStartY = shouldIncludeBack ? 1 : 0
  const seatPanelEndY = shouldIncludeBack ? seatDepth + 1 : seatDepth

  return [
    {
      type: 'gridpanel:xy',
      x: [0, seatWidth],
      y: [seatPanelStartY, seatPanelEndY],
      z: seatHeight,
    },

    shouldIncludeBack && {
      type: 'gridpanel:xz',
      x: [0, seatWidth],
      y: 1,
      z: [seatHeight + 1, seatHeight + 1 + backHeight],
    },

    {
      type: 'gridbeam:z',
      x: 0,
      y: 0,
      z: [0, backZBeamEndZ],
    },
    {
      type: 'gridbeam:z',
      x: seatWidth - 1,
      y: 0,
      z: [0, backZBeamEndZ],
    },
    {
      type: 'gridbeam:z',
      x: 0,
      y: seatDepth - 1,
      z: [0, seatHeight],
    },
    {
      type: 'gridbeam:z',
      x: seatWidth - 1,
      y: seatDepth - 1,
      z: [0, seatHeight],
    },

    {
      type: 'gridbeam:x',
      x: [0, seatWidth],
      y: 1,
      z: seatHeight - 2,
    },
    {
      type: 'gridbeam:x',
      x: [0, seatWidth],
      y: seatDepth - 2,
      z: seatHeight - 2,
    },

    {
      type: 'gridbeam:y',
      x: 1,
      y: [0, seatDepth],
      z: seatHeight - 1,
    },
    {
      type: 'gridbeam:y',
      x: seatWidth - 2,
      y: [0, seatDepth],
      z: seatHeight - 1,
    },
  ]
}
