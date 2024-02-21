import { DesignAssembly } from '@villagekit/design'
import { createContext, useContext, useEffect, useState } from 'react'
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

import { client } from '@/client'
import type { ProductMeta } from '@/api'

import { useEditorContext } from './editor'

const quickWasmVariant = newQuickVariant(QUICK_RELEASE_SYNC, {
  wasmLocation,
})

type ContextProviderProps = {
  children: React.ReactNode
}

export interface ProductOptions {
  productPath: string
}

type ProductMetaState = ProductMeta | null

function useProductMeta(options: ProductOptions): ProductMetaState {
  const { productPath } = options

  const productMetaQuery = client.getProductMeta.useQuery({ productPath })
  const productMeta = productMetaQuery.isSuccess ? productMetaQuery.data : null

  return productMeta
}

const ProductMetaContext = createContext<ProductMetaState>(null)

interface ProductAssemblyOptions {
  productAssemblyPath: string
}

type ProductAssemblyState = {
  file: ProductAssemblyFileState
  render: ProductAssemblyRenderState | null
}

interface ProductAssemblyFileState {
  type: 'typescript' | 'unknown'
  data: string | null
}

const ProductAssemblyFileContext = createContext<ProductAssemblyFileState | null>(null)

function useProductAssemblyFile(options: ProductAssemblyOptions): ProductAssemblyFileState {
  const { productAssemblyPath } = options

  const productAssemblyType = productAssemblyPath.endsWith('.ts') ? 'typescript' : 'unknown'

  const productAssemblyQuery = client.getProductAssembly.useQuery({ productAssemblyPath })
  const productAssemblyData = productAssemblyQuery.isSuccess ? productAssemblyQuery.data : null

  const { setCodeToLoad } = useEditorContext()

  useEffect(() => {
    setCodeToLoad(productAssemblyData)
  }, [setCodeToLoad, productAssemblyData])

  return {
    type: productAssemblyType,
    data: productAssemblyData,
  }
}

type ProductAssemblyRenderState = DesignAssembly | null

const ProductAssemblyRenderContext = createContext<ProductAssemblyRenderState | null>(null)

interface ProductAssemblyRenderOptions {
  productAssemblyData: string
}

function useProductAssemblyTypeScript(
  _options: ProductAssemblyRenderOptions,
): ProductAssemblyRenderState {
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
  const [assemblyRender, setAssemblyRender] = useState<ProductAssemblyRenderState>(null)

  useEffect(() => {
    if (quickJsRuntime == null) return
    if (!isSwcInitialized) return

    const { code: jsCode } = transformSync(tsCode, {})

    const scope = new Scope()

    const vm = scope.manage(quickJsRuntime.newContext())
    const codeResult = vm.evalCode(jsCode, 'index.js', { type: 'module' })
    const moduleExports = scope.manage(vm.unwrapResult(codeResult))
    const assemblyExport = scope.manage(vm.getProp(moduleExports, 'assembly'))
    const assemblyType = vm.dump(scope.manage(vm.getProp(assemblyExport, 'type')))
    if (assemblyType === 'static') {
      const assemblyParts = vm.dump(scope.manage(vm.getProp(assemblyExport, 'parts')))
      setAssemblyRender({ type: assemblyType, parts: assemblyParts })
    } else if (assemblyType === 'parameterized') {
      const assemblyParameters = vm.dump(scope.manage(vm.getProp(assemblyExport, 'parameters')))
      const assemblyPresets = vm.dump(scope.manage(vm.getProp(assemblyExport, 'presets')))
      const assemblyCreateParts = scope.manage(vm.getProp(assemblyExport, 'createParts'))
      setAssemblyRender({
        type: assemblyType,
        parameters: assemblyParameters,
        presets: assemblyPresets,
        createParts: (parameters, variants) => {
          return Scope.withScope((scope) => {
            const vmParameters = scope.manage(
              vm.unwrapResult(vm.evalCode(`(${JSON.stringify(parameters)})`)),
            )
            console.log('variants', JSON.stringify(variants))
            const vmVariants = scope.manage(
              vm.unwrapResult(vm.evalCode(`(${JSON.stringify(variants)})`)),
            )
            const result = vm.callFunction(assemblyCreateParts, vm.null, vmParameters, vmVariants)
            return vm.dump(scope.manage(vm.unwrapResult(result)))
          })
        },
      })
    }

    return () => {
      scope.dispose()
    }
  }, [quickJsRuntime, isSwcInitialized, tsCode])

  return assemblyRender
}

// export helpers

function NullProductAssemblyProvider(props: ContextProviderProps) {
  const { children } = props
  return (
    <ProductAssemblyFileContext.Provider value={null}>
      <ProductAssemblyRenderContext.Provider value={null}>
        {children}
      </ProductAssemblyRenderContext.Provider>
    </ProductAssemblyFileContext.Provider>
  )
}

function NullProductAssemblyRenderProvider(props: ContextProviderProps) {
  const { children } = props
  return (
    <ProductAssemblyRenderContext.Provider value={null}>
      {children}
    </ProductAssemblyRenderContext.Provider>
  )
}

export function ProductProvider(props: ProductOptions & ContextProviderProps) {
  const { children, ...options } = props
  const meta = useProductMeta(options)

  if (meta == null)
    return (
      <ProductMetaContext.Provider value={null}>
        <NullProductAssemblyProvider>{children}</NullProductAssemblyProvider>
      </ProductMetaContext.Provider>
    )

  const { type, entry } = meta

  return (
    <ProductMetaContext.Provider value={meta}>
      {type === 'assembly' ? (
        <ProductAssemblyProvider productAssemblyPath={entry}>{children}</ProductAssemblyProvider>
      ) : (
        <NullProductAssemblyProvider>{children}</NullProductAssemblyProvider>
      )}
    </ProductMetaContext.Provider>
  )
}

function ProductAssemblyProvider(props: ProductAssemblyOptions & ContextProviderProps) {
  const { children, ...options } = props

  const file = useProductAssemblyFile(options)
  const { type, data } = file

  let inner = <NullProductAssemblyRenderProvider>{children}</NullProductAssemblyRenderProvider>
  if (data != null && type === 'typescript') {
    inner = (
      <ProductAssemblyTypeScriptProvider productAssemblyData={data}>
        {children}
      </ProductAssemblyTypeScriptProvider>
    )
  }

  return (
    <ProductAssemblyFileContext.Provider value={file}>{inner}</ProductAssemblyFileContext.Provider>
  )
}

function ProductAssemblyTypeScriptProvider(
  props: ProductAssemblyRenderOptions & ContextProviderProps,
) {
  const { children, ...options } = props
  const value = useProductAssemblyTypeScript(options)
  return (
    <ProductAssemblyRenderContext.Provider value={value}>
      {children}
    </ProductAssemblyRenderContext.Provider>
  )
}

export type ProductState = {
  meta: ProductMeta
  assembly: ProductAssemblyState | null
} | null

export function useProductContext(): ProductState {
  const meta = useContext(ProductMetaContext)
  const assembly = useProductAssemblyContext()

  if (meta == null) return null
  if (assembly == null) return null

  return {
    meta,
    assembly,
  }
}

function useProductAssemblyContext(): ProductAssemblyState | null {
  const file = useContext(ProductAssemblyFileContext)
  const render = useContext(ProductAssemblyRenderContext)

  if (file == null) return null

  return {
    file,
    render,
  }
}
