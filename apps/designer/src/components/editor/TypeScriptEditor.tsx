import {
  createDefaultMapFromCDN,
  createSystem,
  createVirtualTypeScriptEnvironment,
} from '@typescript/vfs'
import { tsSync, tsFacet, tsLinter, tsAutocomplete, tsHover } from '@valtown/codemirror-ts'
import ts from 'typescript'
import { useEffect, useMemo, useRef, useState } from 'react'
import { EditorView } from '@codemirror/view'
import { basicSetup } from 'codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { Box } from '@villagekit/ui'
import { autocompletion } from '@codemirror/autocomplete'

// @ts-ignore
import typesDts from './types.d.ts?raw'

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

  const elementRef = useRef(null)
  const [_editor, setEditor] = useState<EditorView | null>(null)

  const path = 'index.ts'

  useEffect(() => {
    if (elementRef.current == null) return
    if (env == null) return
    setEditor(
      new EditorView({
        doc: `import { DesignAssemblyParameterized, DesignParts } from '@villagekit/design'

const assembly = DesignAssemblyParameterized({
  parameters: {
    height: {
      label: 'Height',
      type: 'number',
      min: 0,
      max: 100,
      step: 5,
    }
  },
  presets: [
    {
      id: 'default',
      label: 'Default',
      values: {
        height: 10
      }
    }
  ],
  createParts(parameters) {
    const { height } = parameters
    const parts: DesignParts = [
      {
        type: 'gridbeam:z',
        x: 0,
        y: 0,
        z: [0, height],
      }
    ]
    return parts
  }
})`,
        extensions: [
          basicSetup,
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
        parent: elementRef.current,
      }),
    )
  }, [env])

  return <Box ref={elementRef} />
}
