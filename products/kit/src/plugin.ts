import type { PartCreator, PartState } from '@villagekit/part'

export interface Plugin<PluginState = unknown> {
  init?: () => void
  generateParts: (parts: Array<PartState>) => Promise<Array<PartCreator>>
  state: PluginState
}
