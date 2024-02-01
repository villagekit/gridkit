import { invoke } from '@tauri-apps/api'
import constate from 'constate'
import { useEffect, useState } from 'react'
import { camelCase, mapKeys, mapValues } from 'lodash-es'

import { ParametersOptions, Presets } from '@villagekit/parameters'

export interface ProductOptions {
  productPath: string
}

export interface ProductMeta<ParamsOptions extends ParametersOptions> {
  name: string
  parameters: ParamsOptions
  presets: Presets<ParamsOptions>
}

export interface Product<ParamsOptions extends ParametersOptions> {
  meta: ProductMeta<ParamsOptions>
}

export interface ProductState<ParamsOptions extends ParametersOptions> {
  product: Product<ParamsOptions> | null
}

function useProduct(options: ProductOptions): ProductState<any> {
  const { productPath } = options

  const [productMeta, setProductMeta] = useState<ProductMeta<any> | null>(null)

  useEffect(() => {
    ;(async () => {
      const productMeta = await invoke('get_product_meta', { productPath })
      const jsProductMeta = {
        // @ts-ignore
        ...productMeta,
        // @ts-ignore
        parameters: mapValues(productMeta.parameters, (parameterOptions) => {
          const { 'short-id': queryParamId, ...rest } = parameterOptions
          return { queryParamId, ...rest }
        }),
        // @ts-ignore
        presets: Object.entries(productMeta.presets).map(([presetId, presetValue]) => {
          // @ts-ignore
          const { label, ...values } = presetValue
          return {
            id: presetId,
            name: label,
            values,
          }
        }),
      } as ProductMeta<any>
      setProductMeta(jsProductMeta)
    })()
  }, [productPath])

  if (productMeta == null) return { product: null }

  return {
    product: {
      meta: productMeta,
    },
  }
}

export const [ProductProvider, useProductContext] = constate(useProduct)
