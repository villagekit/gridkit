import {
  type DesignParts,
  type KitPlugin,
  designPartsSchema,
  generatePartsForPlugins,
  getPartCreatorsFromDesignParts,
} from '@villagekit/design'
import {
  type ExtractValuesFromParams,
  type Params,
  useParams,
  useParamsValues,
  usePresets,
} from '@villagekit/parameters'
import {
  type PartCreator,
  type PartGlValue,
  type PartState,
  calculateBoundingBoxForAll,
  calculateGlValueForAll,
  calculateStateForAll,
  getPartVariants,
} from '@villagekit/part'
import { type ProductTypeProviderProps, useProductCode, useProductMeta } from '@villagekit/product'
import { map, uniq } from 'lodash-es'
import pDebounce from 'p-debounce'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Box3 } from 'three'
import { useRender } from './renders'
import type {
  ExtendDesignValidationErrors,
  Presets,
  Render,
  RenderError,
  ValidationErrors,
} from './types'

type ProductKitState = {
  boundingBox: Box3
  renderError: RenderError
  validationErrors: ValidationErrors
  isLoading: boolean
  partValues: Array<PartGlValue>
  parts: Array<PartState>
}

function useProductKit(props: ProductTypeProviderProps): ProductKitState {
  const { exports: filePath } = useProductMeta()
  const code = useProductCode()

  const [validationErrors, setValidationErrors] = useState({})
  const extendValidationErrors = useCallback((nextValidationErrors: ValidationErrors) => {
    setValidationErrors((validationErrors) => ({
      ...validationErrors,
      ...nextValidationErrors,
    }))
  }, [])

  const { render, renderError } = useRender({ filePath, code })

  const params = useParams()
  const presets = usePresets()
  const paramsValues = useParamsValues()
  useValidateParams({ params, presets }, extendValidationErrors)

  const { isLoading, parts } = useParts({ render, paramsValues })

  const partValues = usePartValues(parts)
  const boundingBox = useBoundingBox(partValues)

  return {
    renderError,
    validationErrors,
    boundingBox,
    isLoading,
    partValues,
    parts,
  }
}

export const ProductKitContext = createContext<ProductKitState | null>(null)

export function ProductKitProvider(props: ProductKitOptions<any> & { children: React.ReactNode }) {
  const { children, ...options } = props
  const value = useProductKit(options)
  return <ProductKitContext.Provider value={value}>{children}</ProductKitContext.Provider>
}

export function useProductKitContext(): ProductKitState {
  const context = useContext(ProductKitContext)
  if (context == null) {
    throw new Error('useProductKitContext must be wrapped in ProductKitProvider')
  }
  return context
}

type UsePartsOptions = {
  kit: Render
  params
}

type UsePartsValue = Pick<ProductKitState, 'isLoading' | 'parts'>

const noPlugins: Array<KitPlugin> = []

function useParts<Ps extends Params>(options: ProductKitOptions<Ps>): UsePartsValue {
  const { kit, paramsValues, extendValidationErrors } = options

  const partVariants = useMemo(() => getPartVariants(), [])

  const [kitParts, setKitParts] = useState<DesignParts>([])
  useEffect(() => {
    if (paramsValues == null) return
    kit.kit(paramsValues, partVariants).then((parts) => {
      const result = designPartsSchema.safeParse(parts)
      if (result.success) {
        setKitParts(result.data)
        extendValidationErrors({ kit: null })
      } else {
        extendValidationErrors({ kit: result.error })
      }
    })
  }, [kit, paramsValues, partVariants, extendValidationErrors])

  const [partCreators, setPartCreators] = useState<Array<PartCreator>>([])
  const [isLoading, setLoading] = useState(false)

  const {
    kit: { plugins = noPlugins },
  } = options
  const generatePluginParts = useMemo(() => {
    return pDebounce((partCreators: Array<PartCreator>) => {
      return generatePartsForPlugins(plugins, partCreators)
    }, 500)
  }, [plugins])

  useEffect(() => {
    const kitPartCreators = getPartCreatorsFromDesignParts(kitParts)
    setPartCreators(kitPartCreators)

    let isCancelled = false

    setLoading(true)

    void generatePluginParts(kitPartCreators).then((generatedParts) => {
      if (!isCancelled && generatedParts.length > 0) {
        setPartCreators([...kitPartCreators, ...generatedParts])
      }

      setLoading(false)
    })

    return () => {
      isCancelled = true
    }
  }, [kitParts, generatePluginParts])

  const partStates = useMemo(() => {
    return calculateStateForAll(partCreators)
  }, [partCreators])

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      // Ensure all parts have unique ids
      const duplicatePartIds = uniq(
        map(partStates, 'id').filter((partId, i, a) => a.indexOf(partId) !== i),
      )

      if (duplicatePartIds.length > 0) {
        throw new Error(`Parts with duplicate ids found: ${duplicatePartIds.join(', ')}`)
      }
    }
  }, [partStates])

  return { isLoading, parts: partStates }
}

function usePartValues(partStates: Array<PartState>): Array<PartGlValue> {
  return useMemo(() => {
    return calculateGlValueForAll(partStates)
  }, [partStates])
}

function useBoundingBox(partGlValues: Array<PartGlValue>): Box3 {
  return useMemo(() => {
    return calculateBoundingBoxForAll(partGlValues)
  }, [partGlValues])
}

function useValidateParams(
  params: Params | null,
  presets: Presets<any> | null,
  extendValidationErrors: ExtendValidationErrors,
) {
  useEffect(() => {
    if (params == null || presets == null) return

    const paramsResult = paramsSchema.safeParse(params)
    const paramsError = paramsResult.success ? null : paramsResult.error

    const presetsSchema = getPresetsSchema(params)
    const presetsResult = presetsSchema.safeParse(presets)
    const presetsError = presetsResult.success ? null : presetsResult.error
    extendValidationErrors({
      params: paramsError,
      presets: presetsError,
    })
  }, [params, presets, extendValidationErrors])
}
