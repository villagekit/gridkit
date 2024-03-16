import {
  type Params,
  ParamsProvider,
  type ParamsValues,
  type Presets,
  getPresetsSchema,
  parametersSchema,
} from '@villagekit/parameters'
import {
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ActorRefFrom } from 'xstate'
import type { ProductMachineInput, productMachine } from './machine'
import type {
  ExtendValidationErrors,
  ProductData,
  ProductMeta,
  ProductModule,
  ValidationErrors,
} from './types'

type ProductOptions = ProductData & {
  Products: Array<ProductModule>
  onLocationUpdate?: (location: Location) => void
}

type ProductProviderProps = PropsWithChildren<ProductOptions>

type Parametrics<Ps extends Params> = {
  parameters: Ps
  presets: Presets<Ps>
}

type ProductContext = {
  Product: ProductModule
  meta: ProductMeta
  parameters: Params | null
  presets: Presets<any> | null
  parametersValues: ParamsValues | null
  setParamics: (parametrics: Parametrics<any>) => void
  validationErrors: ValidationErrors
  extendValidationErrors: ExtendValidationErrors
}

export const ProductContext = createContext<ProductState | null>(null)

export function useProductContext(): ProductState {
  const context = useContext(ProductContext)
  if (context == null) {
    throw new Error('useProductContext must be wrapped in ProductProvider')
  }
  return context
}

export function ProductProvider(props: ProductProviderProps) {
  const { meta, Products, onLocationUpdate, children } = props

  const [parameterics, setParamics] = useState<Parametrics<any> | null>(null)
  const { parameters = null, presets = null } = parameterics ?? {}
  const [parametersValues, setParamsValues] = useState<ParamsValues | null>(null)

  const [validationErrors, setValidationErrors] = useState({})
  const extendValidationErrors = useCallback((nextValidationErrors: ValidationErrors) => {
    setValidationErrors((validationErrors) => ({
      ...validationErrors,
      ...nextValidationErrors,
    }))
  }, [])

  useValidateParamics(parameterics, extendValidationErrors)

  const Product = useMemo(() => {
    return Products.find((P) => P.id === meta.type)
  }, [meta, Products])

  const state = {
    Product,
    meta,
    parameters,
    presets,
    parametersValues,
    setParamics,
    validationErrors,
    extendValidationErrors,
  }

  return (
    <ProductContext.Provider value={state}>
      <ParamsProvider
        parameters={parameters}
        presets={presets}
        onParamsValuesUpdate={setParamsValues}
        onLocationUpdate={onLocationUpdate}
      >
        <ProductTypeProvider meta={meta} Products={Products}>
          {children}
        </ProductTypeProvider>
      </ParamsProvider>
    </ProductContext.Provider>
  )
}

type ProductTypeProviderProps = PropsWithChildren<{
  meta: ProductMeta
  Products: Array<ProductModule>
}>

function ProductTypeProvider(props: ProductTypeProviderProps) {
  const { meta, Product } = props

  if (Product == null) {
    throw new Error(`Unknown product type: ${meta.type}`)
  }

  return <Product.components.ProductProvider />
}

function useValidateParamics<Ps extends Params>(
  parametrics: Parametrics<Ps> | null,
  extendValidationErrors: ExtendValidationErrors,
) {
  useEffect(() => {
    if (parametrics == null) return
    const { parameters, presets } = parametrics

    const parametersResult = parametersSchema.safeParse(parameters)
    const parametersError = parametersResult.success ? null : parametersResult.error

    const presetsSchema = getPresetsSchema(parameters)
    const presetsResult = presetsSchema.safeParse(presets)
    const presetsError = presetsResult.success ? null : presetsResult.error
    extendValidationErrors({
      parameters: parametersError,
      presets: presetsError,
    })
  }, [parametrics, extendValidationErrors])
}

export const ProductContext = createContext<ActorRefFrom<typeof productMachine> | null>(null)

type ParamsProviderProps = PropsWithChildren<ProductMachineInput>

export function ProductProvider(
  props: ParamsProviderProps,
) {
  const { machine, props, code } = props

  if (parameters == null) return children
  if (presets == null) return children

  return (
    <ParamsProviderContext parameters={parameters} presets={presets} {...rest}>
      {children}
    </ParamsProviderContext>
  )
}

function ParamsProviderContext(props: ParamsProviderProps) {
  const { children, parameters, presets, onLocationUpdate } = props

  const actorRef = useActorRef(parametersMachine, {
    input: { parameters, presets, onLocationUpdate },
  })

  // handle updateInput
  useEffect(() => {
    actorRef.send({ type: 'updateInput', parameters, presets, onLocationUpdate })
  }, [actorRef, parameters, presets, onLocationUpdate])

  return <ParamsContext.Provider value={actorRef}>{children}</ParamsContext.Provider>
}

function useParamsActor(): ActorRefFrom<typeof parametersMachine> {
  const actor = useContext(ParamsContext)
  if (actor == null) {
    throw new Error(
      "You used a hook for ParamsContext but it's not inside a ParamsProvider component",
    )
  }
  return actor
}

export const useHasParams = () => useContext(ParamsContext) != null

type ParamsSnapshot = SnapshotFrom<typeof parametersMachine>
const selectParams = (snapshot: ParamsSnapshot) => snapshot.context.parameters
export const useParams = () => useSelector(useParamsActor(), selectParams)
const selectPresets = (snapshot: ParamsSnapshot) => snapshot.context.presets
export const usePresets = () => useSelector(useParamsActor(), selectPresets)
const selectPresetId = (snapshot: ParamsSnapshot) => snapshot.context.presetId
export const usePresetId = () => useSelector(useParamsActor(), selectPresetId)
const selectParamsValues = (snapshot: ParamsSnapshot) => snapshot.context.parametersValues
export const useParamsValues = () => useSelector(useParamsActor(), selectParamsValues)
const selectShowControls = (snapshot: ParamsSnapshot) => snapshot.context.showControls
export const useShowControls = () => useSelector(useParamsActor(), selectShowControls)

export function useSetShowControls() {
  const actorRef = useParamsActor()
  return useCallback(
    (showControls: boolean) => actorRef.send({ type: 'setShowControls', showControls }),
    [actorRef],
  )
}
