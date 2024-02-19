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

interface TypeScriptEditorProps {
  data: string
  setData: (data: string) => void
}

export function TypeScriptEditor(props: TypeScriptEditorProps) {
  const { data, setData } = props

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
        doc: data,
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
  }, [env, data])

  return <Box ref={elementRef} />
}
