import { ParamsProvider } from '@villagekit/parameters'
import { useActorRef, useSelector } from '@xstate/react'
import { type PropsWithChildren, createContext, useContext, useEffect, useMemo } from 'react'
import type { ActorRefFrom, SnapshotFrom } from 'xstate'
import { ProductTypeProvider } from './components'
import { type ProductMachineInput, productMachine } from './machine'

type ProductProviderProps = PropsWithChildren<
  ProductMachineInput & {
    onLocationUpdate?: (location: Location) => void
  }
>

export const ProductContext = createContext<ActorRefFrom<typeof productMachine> | null>(null)

export function ProductProvider(props: ProductProviderProps) {
  const { children, onLocationUpdate, meta, Products, code } = props

  const input = useMemo(
    () => ({
      meta,
      Products,
      code,
    }),
    [meta, Products, code],
  )

  const actorRef = useActorRef(productMachine, {
    input,
  })

  // handle updateInput
  useEffect(() => {
    actorRef.send({ type: 'updateInput', input })
  }, [actorRef, input])

  return (
    <ProductContext.Provider value={actorRef}>
      <ParamsProvider onLocationUpdate={onLocationUpdate}>
        <ProductTypeProvider>{children}</ProductTypeProvider>
      </ParamsProvider>
    </ProductContext.Provider>
  )
}

function useProductActor(): ActorRefFrom<typeof productMachine> {
  const actor = useContext(ProductContext)
  if (actor == null) {
    throw new Error(
      "You used a hook for ProductContext but it's not inside a ProductProvider component",
    )
  }
  return actor
}

export const useHasProduct = () => useContext(ProductContext) != null

type ProductSnapshot = SnapshotFrom<typeof productMachine>
const selectProductModule = (snapshot: ProductSnapshot) => snapshot.context.Product
export const useProductModule = () => useSelector(useProductActor(), selectProductModule)
const selectProductMeta = (snapshot: ProductSnapshot) => snapshot.context.meta
export const useProductMeta = () => useSelector(useProductActor(), selectProductMeta)
const selectProductCode = (snapshot: ProductSnapshot) => snapshot.context.code
export const useProductCode = () => useSelector(useProductActor(), selectProductCode)
