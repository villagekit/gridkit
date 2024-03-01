import React, { useEffect } from 'react'

import { RendererProps } from './'
import { designAssemblySafeParse } from '@villagekit/design'

export function DesignRendererAssemblyJavaScript(
  props: RendererProps<any> & { code: string | null },
) {
  const { code: jsCode, setRender, setError } = props

  useEffect(() => {
    if (jsCode == null) return
    ;(async () => {
      const jsCodeWithoutImports = jsCode.replace(
        /import (.*) from [\"\']@villagekit\/design[\"\']/,
        'const $1 = villagekit.design',
      )
      const jsModuleCode = `
        "use strict";

        const villagekit = {
          design: {
            DesignAssemblyParameterized: (design) => ({ type: 'parameterized', ...design })
          }
        }

        ${jsCodeWithoutImports}
      `

      let jsModule
      try {
        const jsModuleUrl = URL.createObjectURL(
          new Blob([jsModuleCode], { type: 'text/javascript' }),
        )
        jsModule = await import(/* @vite-ignore */ jsModuleUrl)
        URL.revokeObjectURL(jsModuleUrl)
      } catch (error) {
        if (error instanceof Error || typeof error === 'string') {
          setError(error)
          return
        } else {
          throw error
        }
      }

      // validate module
      if (jsModule.assembly == null) return
      const assemblyResult = designAssemblySafeParse(jsModule.assembly)

      if (assemblyResult == null) return
      if (assemblyResult.success) {
        // TODO: fix
        // @ts-ignore
        setRender(assemblyResult.data)
      } else {
        setError(assemblyResult.error)
      }
    })()
  }, [jsCode, setRender, setError])

  return <React.Fragment />
}
