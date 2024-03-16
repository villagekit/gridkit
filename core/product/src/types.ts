import type { FunctionComponent, PropsWithChildren } from 'react'
import type { z } from 'zod'
import type { metaSchema } from './schema'

export type ProductMeta = z.infer<typeof metaSchema>

export type ProductData = {
  meta: ProductMeta
  code: string
}

export type ProductTypeProviderProps = PropsWithChildren<{}>
export type ProductViewMode = 'default' | 'screenshot'
export type ProductViewProps = {
  mode?: ProductViewMode
  isDebug?: boolean
  showParamControls?: boolean
  alwaysShowFullscreenControls?: boolean
  shouldRenderProductInfo?: boolean
}
export type ProductSummaryProps = {}
export type ProductInfoProps = {
  containerRef: React.RefObject<HTMLDivElement>
}

export type ProductModule = {
  id: string
  components: {
    ProductProvider: FunctionComponent<ProductTypeProviderProps>
    ProductView: FunctionComponent<ProductViewProps>
    ProductSummary: FunctionComponent<ProductSummaryProps>
    ProductInfo: FunctionComponent<ProductInfoProps>
  }
}
