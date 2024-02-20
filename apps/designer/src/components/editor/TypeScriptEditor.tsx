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
import {
  newQuickJSWASMModuleFromVariant,
  newVariant as newQuickVariant,
  RELEASE_SYNC as QUICK_RELEASE_SYNC,
  QuickJSWASMModule,
} from 'quickjs-emscripten'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - ?url returns a URL resolving to the given asset.
import wasmLocation from '@jitl/quickjs-wasmfile-release-sync/wasm?url'
import initSwc, { transformSync } from '@swc/wasm-web'

import type { ProductType } from '@/api'
import { useEditorContext } from '@/context/editor'

// @ts-ignore
import typesDts from './types.d.ts?raw'

import { BaseEditor } from './BaseEditor'

const quickWasmVariant = newQuickVariant(QUICK_RELEASE_SYNC, {
  wasmLocation,
})

interface TypeScriptEditorProps {
  productType: ProductType
}

export function TypeScriptEditor(props: TypeScriptEditorProps) {
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

  const [quickJs, setQuickJs] = useState<QuickJSWASMModule | null>(null)
  useEffect(() => {
    newQuickJSWASMModuleFromVariant(quickWasmVariant).then(setQuickJs)
  }, [])

  const [isSwcInitialized, setSwcInitialized] = useState(false)
  useEffect(() => {
    initSwc().then(() => setSwcInitialized(true))
  }, [])

  const { code: tsCode } = useEditorContext()

  useEffect(() => {
    if (quickJs == null) return
    if (!isSwcInitialized) return
    const vm = quickJs.newContext()
    const jsCode = transformSync(tsCode, {})
    console.log('js', jsCode)
  }, [isSwcInitialized, tsCode])

  if (env == null) return null

  return <BaseEditor languageExtensions={languageExtensions} />
}
