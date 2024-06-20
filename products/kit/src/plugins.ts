import { type PartCreator, calculateStateForAll } from '@villagekit/part'
import { flatten } from 'lodash-es'

import type { Plugin } from './plugin'

export async function generatePartsForPlugins(
  plugins: Array<Plugin>,
  partCreators: Array<PartCreator>,
): Promise<Array<PartCreator>> {
  const partStates = calculateStateForAll(partCreators)
  const pluginParts = await Promise.all(
    plugins.map((plugin) => {
      // NOTE: plugin functions must be called as methods,
      // not standalone functions, in order to maintain 'this'.
      if (plugin.init != null) plugin.init()
      return plugin.generateParts(partStates)
    }),
  )
  return flatten(pluginParts)
}
