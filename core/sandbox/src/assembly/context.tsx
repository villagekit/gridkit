import { ParametersOptions } from '@villagekit/parameters'
import {
  calculateBoundingBoxForAll,
  calculateGlValueForAll,
  calculateStateForAll,
  getPartVariants,
  PartCreator,
  PartGlValue,
  PartState,
} from '@villagekit/part'
import { map, uniq } from 'lodash-es'
import pDebounce from 'p-debounce'
import { useEffect, useMemo, useState } from 'react'
import { Box3 } from 'three'

import {
  AssemblyPlugin,
  DesignParts,
  generatePartsForPlugins,
  getPartCreatorsFromDesignParts,
} from '@villagekit/design'
import { DesignAssembly } from '@villagekit/design'
import constate from 'constate'

type SandboxAssemblyOptions = {
  assembly: DesignAssembly
  parameterValues: ParametersOptions
}

type SandboxAssemblyState = {
  boundingBox: Box3
  isLoading: boolean
  partValues: Array<PartGlValue>
  parts: Array<PartState>
}

function useSandboxAssembly(props: SandboxAssemblyOptions): SandboxAssemblyState {
  const { isLoading, parts } = useParts(props)

  const partValues = usePartValues(parts)
  const boundingBox = useBoundingBox(partValues)

  return {
    boundingBox,
    isLoading,
    partValues,
    parts,
  }
}

export const [SandboxAssemblyProvider, useSandboxAssemblyContext] = constate(useSandboxAssembly)

type UsePartsValue = Pick<SandboxAssemblyState, 'isLoading' | 'parts'>

const noPlugins: Array<AssemblyPlugin> = []

function useParts(options: SandboxAssemblyOptions): UsePartsValue {
  const { assembly, parameterValues } = options

  const partVariants = useMemo(() => getPartVariants(), [])

  const [assemblyParts, setAssemblyParts] = useState<DesignParts>([])
  useEffect(() => {
    switch (assembly.type) {
      case 'static':
        setAssemblyParts(assembly.parts)
        break
      case 'parameterized': {
        const parts = assembly.createParts(parameterValues, partVariants)
        if (parts instanceof Promise) {
          parts.then(setAssemblyParts)
        } else {
          setAssemblyParts(parts)
        }
        break
      }
    }
  }, [assembly, parameterValues, partVariants])

  const [partCreators, setPartCreators] = useState<Array<PartCreator>>([])
  const [isLoading, setLoading] = useState(false)

  const {
    assembly: { plugins = noPlugins },
  } = options
  const generatePluginParts = useMemo(() => {
    return pDebounce((partCreators: Array<PartCreator>) => {
      return generatePartsForPlugins(plugins, partCreators)
    }, 500)
  }, [plugins])

  useEffect(() => {
    const assemblyPartCreators = getPartCreatorsFromDesignParts(assemblyParts)
    setPartCreators(assemblyPartCreators)

    let isCancelled = false

    setLoading(true)

    void generatePluginParts(assemblyPartCreators).then((generatedParts) => {
      if (!isCancelled && generatedParts.length > 0) {
        setPartCreators([...assemblyPartCreators, ...generatedParts])
      }

      setLoading(false)
    })

    return () => {
      isCancelled = true
    }
  }, [assemblyParts, generatePluginParts])

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
