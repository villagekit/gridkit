import { DesignAssembly } from '@villagekit/design'
import { createContext, useContext } from 'react'

import { client } from '@/client'
import type { ProductMeta } from '@/api'

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
  setData: (data: string) => void
}

const ProductAssemblyFileContext = createContext<ProductAssemblyFileState | null>(null)

function useProductAssemblyFile(options: ProductAssemblyOptions): ProductAssemblyFileState {
  const { productAssemblyPath } = options

  const productAssemblyType = productAssemblyPath.endsWith('.ts') ? 'typescript' : 'unknown'

  const productAssemblyQuery = client.getProductAssembly.useQuery({ productAssemblyPath })
  const productAssemblyData = productAssemblyQuery.isSuccess ? productAssemblyQuery.data : null

  return {
    type: productAssemblyType,
    data: productAssemblyData,
    setData: () => {},
  }
}

type ProductAssemblyRenderState = DesignAssembly

const ProductAssemblyRenderContext = createContext<ProductAssemblyRenderState | null>(null)

interface ProductAssemblyRenderOptions {
  productAssemblyData: string
}

function useProductAssemblyTypeScript(
  _options: ProductAssemblyRenderOptions,
): ProductAssemblyRenderState {
  return {
    type: 'static',
    parts: [],
  }
}

// export helpers

function NullProductAssemblyContext(props: ContextProviderProps) {
  const { children } = props
  return (
    <ProductAssemblyFileContext.Provider value={null}>
      <ProductAssemblyRenderContext.Provider value={null}>
        {children}
      </ProductAssemblyRenderContext.Provider>
    </ProductAssemblyFileContext.Provider>
  )
}

function NullProductAssemblyRenderContext(props: ContextProviderProps) {
  const { children } = props
  return (
    <ProductAssemblyRenderContext.Provider value={null}>
      {children}
    </ProductAssemblyRenderContext.Provider>
  )
}

export function ProductContextProvider(props: ProductOptions & ContextProviderProps) {
  const { children, ...options } = props
  const meta = useProductMeta(options)

  if (meta == null)
    return (
      <ProductMetaContext.Provider value={null}>
        <NullProductAssemblyContext>{children}</NullProductAssemblyContext>
      </ProductMetaContext.Provider>
    )

  const { type, entry } = meta

  return (
    <ProductMetaContext.Provider value={meta}>
      {type === 'assembly' ? (
        <ProductAssemblyContextProvider productAssemblyPath={entry}>
          {children}
        </ProductAssemblyContextProvider>
      ) : (
        <NullProductAssemblyContext>{children}</NullProductAssemblyContext>
      )}
    </ProductMetaContext.Provider>
  )
}

function ProductAssemblyContextProvider(props: ProductAssemblyOptions & ContextProviderProps) {
  const { children, ...options } = props

  const file = useProductAssemblyFile(options)
  const { type, data } = file

  let inner = <NullProductAssemblyRenderContext>{children}</NullProductAssemblyRenderContext>
  if (data != null && type === 'typescript') {
    inner = (
      <ProductAssemblyTypeScriptContextProvider productAssemblyData={data}>
        {children}
      </ProductAssemblyTypeScriptContextProvider>
    )
  }

  return (
    <ProductAssemblyFileContext.Provider value={file}>{inner}</ProductAssemblyFileContext.Provider>
  )
}

function ProductAssemblyTypeScriptContextProvider(
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
