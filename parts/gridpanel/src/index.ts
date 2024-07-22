import { registerPartModule } from '@villagekit/part'
import { gridPanelVariants } from './creator'
import { type GridPanelCreator, calculateState } from './creators'
import { PartsGl } from './gl'
import {
  calculateBoundingBox,
  calculateFasteningPoints,
  calculateGlValue,
  calculateNumFastenersToFasten,
} from './methods'
import { gridPanelSchemas } from './schemas'
import { PartsSummary } from './summary'
import type { GridPanelGlValue, GridPanelState, GridPanelType } from './types'

export * from './svg/index'
export * from './types'
export * from './variants'

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace VK {
    interface EveryPartTypeId {
      gridpanel: GridPanelType
    }
    interface EveryPartCreator {
      gridpanel: GridPanelCreator
    }
    interface EveryPartState {
      gridpanel: GridPanelState
    }
    interface EveryPartVariants {
      gridpanel: typeof gridPanelVariants
    }
    interface EveryPartGlValue {
      gridpanel: GridPanelGlValue
    }
  }
}

registerPartModule({
  components: {
    PartsGl,
    PartsSummary,
  },
  id: 'gridpanel' as const,
  methods: {
    calculateBoundingBox,
    calculateFasteningPoints,
    calculateGlValue,
    calculateNumFastenersToFasten,
    calculateState,
  },
  variants: gridPanelVariants,
  schemas: gridPanelSchemas,
})
