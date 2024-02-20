import {
  createDefaultMapFromCDN,
  createSystem,
  createVirtualTypeScriptEnvironment,
} from '@typescript/vfs'
import { tsSync, tsFacet, tsLinter, tsAutocomplete, tsHover } from '@valtown/codemirror-ts'
import ts from 'typescript'
import { useEffect, useMemo, useState } from 'react'
import { javascript } from '@codemirror/lang-javascript'
import { autocompletion } from '@codemirror/autocomplete'

// @ts-ignore
import typesDts from './types.d.ts?raw'

import { BaseEditor } from './BaseEditor'

export function TypeScriptEditor() {
  const [fsMap, setFsMap] = useState<Map<string, string> | null>(null)
  useEffect(() => {
    ;(async () => {
      const map = await createDefaultMapFromCDN(
        { target: ts.ScriptTarget.ES2022 },
        ts.version,
        true,
        ts,
      )
      map.set('/node_modules/@villagekit/design/index.d.ts', typesDts)
      setFsMap(map)
    })()
  }, [])

  const system = useMemo(() => {
    if (fsMap == null) return null
    return createSystem(fsMap)
  }, [fsMap])

  const env = useMemo(() => {
    if (system == null) return null
    return createVirtualTypeScriptEnvironment(system, [], ts, {})
  }, [system])

  const path = 'index.ts'

  const languageExtensions = useMemo(
    () =>
      env == null
        ? []
        : [
            javascript({
              typescript: true,
              jsx: false,
            }),
            tsFacet.of({ env, path }),
            tsSync(),
            tsLinter(),
            autocompletion({
              override: [tsAutocomplete()],
            }),
            tsHover(),
          ],
    [env],
  )

  if (env == null) return null

  return <BaseEditor languageExtensions={languageExtensions} />
}
