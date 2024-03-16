import { PartsGlForAll } from '@villagekit/part'
import { type ProductViewProps, useProductMeta } from '@villagekit/product'
import { Sandbox } from '@villagekit/sandbox'
import { ProductKitContext, useProductKitContext } from './context'

export function ProductKitView(props: ProductViewProps) {
  const { ...sandboxProps } = props

  const meta = useProductMeta()

  const { boundingBox, partValues: partGlValues } = useProductKitContext()

  return (
    <Sandbox
      label={meta.label}
      boundingBox={boundingBox}
      bridgeContexts={[ProductKitContext]}
      {...sandboxProps}
    >
      <PartsGlForAll partGlValues={partGlValues} />
    </Sandbox>
  )
}
