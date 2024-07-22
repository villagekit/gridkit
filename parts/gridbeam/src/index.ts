import { registerPartModule } from '@villagekit/part'
import type { GridBeam } from './creator'
import { PartsGl } from './gl'
import {
  calculateBoundingBox,
  calculateFasteningPoints,
  calculateGlValue,
  calculateNumFastenersToFasten,
  calculateState,
} from './methods'
import { gridBeamSchemas } from './schemas'
import { PartsSummary } from './summary'
import type { GridBeamGlValue, GridBeamState, GridBeamType } from './types'
import { gridBeamVariants } from './variants'

export * from './svg/index'
export * from './types'
export { gridBeamVariants }

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace VK {
    interface EveryPartTypeId {
      gridbeam: GridBeamType
    }
    interface EveryPartCreator {
      gridbeam: GridBeam
    }
    interface EveryPartState {
      gridbeam: GridBeamState
    }
    interface EveryPartVariants {
      gridbeam: typeof gridBeamVariants
    }
    interface EveryPartGlValue {
      gridbeam: GridBeamGlValue
    }
  }
}

registerPartModule({
  components: {
    PartsGl,
    PartsSummary,
  },
  id: 'gridbeam' as const,
  methods: {
    calculateBoundingBox,
    calculateFasteningPoints,
    calculateGlValue,
    calculateNumFastenersToFasten,
    calculateState,
  },
  variants: gridBeamVariants,
  schemas: gridBeamSchemas,
})
