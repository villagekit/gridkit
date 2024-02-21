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
  QuickJSRuntime,
  QuickJSWASMModule,
  Scope,
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

  const [_quickJs, setQuickJs] = useState<QuickJSWASMModule | null>(null)
  const [quickJsRuntime, setQuickJsRuntime] = useState<QuickJSRuntime | null>(null)
  useEffect(() => {
    ;(async () => {
      const newQuickJs = await newQuickJSWASMModuleFromVariant(quickWasmVariant)
      setQuickJs(newQuickJs)

      const newQuickJsRuntime = newQuickJs.newRuntime()
      newQuickJsRuntime.setModuleLoader((moduleName) => {
        console.log('load module', moduleName)
        switch (moduleName) {
          case '@villagekit/design':
            return `
  export const DesignAssemblyParameterized = (design) => ({
    type: 'parameterized',
    ...design
  })
            `
        }
        throw new Error(`Unexpected module : ${moduleName}`)
      })
      setQuickJsRuntime(newQuickJsRuntime)
    })()
  }, [])
  useEffect(() => () => quickJsRuntime?.dispose(), [quickJsRuntime])

  const [isSwcInitialized, setSwcInitialized] = useState(false)
  useEffect(() => {
    initSwc().then(() => setSwcInitialized(true))
  }, [])

  const { code: tsCode } = useEditorContext()

  useEffect(() => {
    if (quickJsRuntime == null) return
    if (!isSwcInitialized) return

    const { code: jsCode } = transformSync(tsCode, {})

    Scope.withScope((scope) => {
      const vm = scope.manage(quickJsRuntime.newContext())
      const codeResult = vm.evalCode(jsCode, 'index.js', { type: 'module' })
      const moduleExports = scope.manage(vm.unwrapResult(codeResult))
      console.log('exports', vm.dump(moduleExports))
    })
  }, [quickJsRuntime, isSwcInitialized, tsCode])

  if (env == null) return null

  return <BaseEditor languageExtensions={languageExtensions} />
}
