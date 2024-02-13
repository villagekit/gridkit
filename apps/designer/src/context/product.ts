import constate from 'constate'
import { useEffect, useState } from 'react'
import { mapValues } from 'lodash-es'

import { ParametersOptions, Presets } from '@villagekit/parameters'
import { DesignAssemblyParameterized, DesignMeta } from '@villagekit/design'
import { client } from '@/client'

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

  const productAssemblyMetaQuery = client.getProductAssemblyMeta.useQuery()
  const productAssemblyMeta = productAssemblyMetaQuery.isSuccess
    ? productAssemblyMetaQuery.data
    : null

  /*
  useEffect(() => {
    ;(async () => {
      const productMetaRs = await invoke('get_product_meta', { productPath })
      const productMeta = {
        // @ts-ignore
        id: productMetaRs.id,
        // @ts-ignore
        name: productMetaRs.label,
        // @ts-ignore
        description: productMetaRs.description ?? '',
      }
      setProductMeta(productMeta as ProductMeta)
    })()
  }, [productPath])

  useEffect(() => {
    ;(async () => {
      const productAssemblyMetaRs = await invoke('get_product_assembly_meta', { productPath })
      const productAssemblyMeta = {
        // @ts-ignore
        parameters: mapValues(productAssemblyMetaRs.parameters, (parameterOptions) => {
          const { 'short-id': queryParamId, ...rest } = parameterOptions
          return { queryParamId, ...rest }
        }),
        // @ts-ignore
        presets: Object.entries(productAssemblyMetaRs.presets).map(([presetId, presetValue]) => {
          // @ts-ignore
          const { label, ...values } = presetValue
          return {
            id: presetId,
            name: label,
            values,
          }
        }),
      }
      setProductAssemblyMeta(productAssemblyMeta as ProductAssemblyMeta<any>)
    })()
  }, [productPath])
  */

  if (productMeta == null) return { product: null }
  if (productAssemblyMeta == null) return { product: null }

  return { product: { meta: productMeta }, assembly: null }

  /*
  return {
    product: {
      meta: productMeta,
      assembly: {
        ...productAssemblyMeta,
        type: 'parameterized',
        parameters: {},
        createParts: () => [],
      },
    },
  }
  */
}

export const [ProductProvider, useProductContext] = constate(useProduct)
