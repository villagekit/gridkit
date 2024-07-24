import {
  createDefaultMapFromCDN,
  createSystem,
  createVirtualTypeScriptEnvironment,
} from '@typescript/vfs'
import { createWorker } from '@valtown/codemirror-ts/worker'
import * as Comlink from 'comlink'
import ts from 'typescript'

// @ts-ignore
import designKitDts from '@villagekit/design/type-bundles/kit.d.ts?raw'
// @ts-ignore
import gridbeamDts from '@villagekit/part-gridbeam/type-bundles/creator.d.ts?raw'
// @ts-ignore
import gridpanelDts from '@villagekit/part-gridpanel/type-bundles/creator.d.ts?raw'

Comlink.expose(
  createWorker(async () => {
    const fsMap = await createDefaultMapFromCDN(
      { target: ts.ScriptTarget.ES2022 },
      ts.version,
      false,
      ts,
    )
    fsMap.set('/node_modules/@villagekit/design/kit.d.ts', designKitDts)
    fsMap.set('/node_modules/@villagekit/part-gridbeam/creator.d.ts', gridbeamDts)
    fsMap.set('/node_modules/@villagekit/part-gridpanel/creator.d.ts', gridpanelDts)
    const system = createSystem(fsMap)
    const compilerOpts = {}
    return createVirtualTypeScriptEnvironment(system, [], ts, compilerOpts)
  }),
)
