import constate from 'constate'

import { QuickJSWASMModule, getQuickJS } from 'quickjs-emscripten'
import { useEffect, useState } from 'react'

function useEval() {
  const [quickjs, setQuickJs] = useState<QuickJSWASMModule | null>(null)

  useEffect(() => {
    ;(async () => {
      setQuickJs(await getQuickJS())
    })()
  }, [])

  const vm = 
}

export interface ProductOptions {
  productPath: string
}

export type ProductMeta = DesignMeta

export interface ProductAssemblyMeta<ParamsOptions extends ParametersOptions> {
  parameters: ParamsOptions
  presets: Presets<ParamsOptions>
}

export type Product<ParamsOptions extends ParametersOptions> = {
  meta: ProductMeta
  assembly: DesignAssemblyParameterized<ParamsOptions>
}

export interface ProductState<ParamsOptions extends ParametersOptions> {
  product: Product<ParamsOptions> | null
}

function useProduct(options: ProductOptions): ProductState<any> {
  const { productPath } = options

  const productMetaQuery = client.getProductMeta.useQuery({ productPath })
  const productMeta = productMetaQuery.isSuccess ? productMetaQuery.data : null

  const productAssemblyMetaQuery = client.getProductAssemblyMeta.useQuery({ productPath })
  const productAssemblyMeta = productAssemblyMetaQuery.isSuccess
    ? productAssemblyMetaQuery.data
    : null

  const productAssembly = useMemo(
    () =>
      productAssemblyMeta == null
        ? null
        : {
            type: 'parameterized' as const,
            parameters: {},
            ...productAssemblyMeta,
            createParts: () => [],
          },
    [productAssemblyMeta],
  )

  if (productMeta == null) return { product: null }
  if (productAssembly == null) return { product: null }

  return {
    product: {
      meta: productMeta,
      assembly: productAssembly,
    },
  }
}

export const [ProductProvider, useProductContext] = constate(useProduct)
