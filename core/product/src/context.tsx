import {
  type Parameters,
  ParametersProvider,
  type ParametersValues,
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
import type { ExtendValidationErrors, ProductData, ProductModule, ValidationErrors } from './types'

type ProductOptions = ProductData & {
  Products: Array<ProductModule>
  onLocationUpdate?: (location: Location) => void
}

type ProductProviderProps = PropsWithChildren<ProductOptions>

type ProductState = {
  parameters: Parameters
  presets: Presets<any>
  parametersValues: ParametersValues
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

type Parametrics<Params extends Parameters> = {
  parameters: Params
  presets: Presets<Params>
}

export function ProductProvider(props: ProductProviderProps) {
  const { meta, onLocationUpdate, children } = props

  const [parameterics, setParameterics] = useState<Parametrics<any> | null>(null)
  const { parameters = null, presets = null } = parameterics ?? {}
  const [parametersValues, setParametersValues] = useState<ParametersValues | null>(null)

  const [validationErrors, setValidationErrors] = useState({})
  const extendValidationErrors = useCallback((nextValidationErrors: ValidationErrors) => {
    setValidationErrors((validationErrors) => ({
      ...validationErrors,
      ...nextValidationErrors,
    }))
  }, [])

  useValidateParameterics(parameterics, extendValidationErrors)

  const state = {
    parameters,
    presets,
    parametersValues,
    setParameterics,
    validationErrors,
    extendValidationErrors,
  }

  return (
    <ProductContext.Provider value={state}>
      <ParametersProvider
        parameters={parameters}
        presets={presets}
        onParametersValuesUpdate={setParametersValues}
        onLocationUpdate={onLocationUpdate}
      >
        <ProductTypeProvider
        {renderTyped}
      </ParametersProvider>
    </ProductContext.Provider>
  )
}

type ProductTypeProviderProps = ProductProviderProps & {
  setParameterics: (parametrics: Parametrics<any> | null) => void
  extendValidationErrors: ExtendValidationErrors
}

function ProductTypeProvider(props: ProductProviderProps) {
  const { meta, Products, ...rest } = props

  const Product = useMemo(() => {
    return Products.find((P) => P.id === meta.type)
  }, [meta, Products])

  if (Product == null) {
    throw new Error(`Unknown product type: ${meta.type}`)
  }

  return <Product.components.ProductProvider meta={meta} {...rest} />
}

function useValidateParameterics<Params extends Parameters>(
  parametrics: Parametrics<Params> | null,
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
