import { useEffect, useState } from 'react'

import { RenderOutput } from './'
import { designAssemblySafeParse } from '@villagekit/design'

export function useDesignAssemblyJavaScript(jsCode: string): RenderOutput<any> {
  const [outputRender, setOutputRender] = useState<RenderOutput<any>['render']>(null)
  const [outputError, setOutputError] = useState<RenderOutput<any>['error']>(null)

  useDesignAssemblyJavaScriptInner(jsCode, { setOutputRender, setOutputError })

  return {
    render: outputRender,
    error: outputError,
  }
}

export function useDesignAssemblyJavaScriptInner(
  jsCode: string | null,
  {
    setOutputRender,
    setOutputError,
  }: {
    setOutputRender: (render: RenderOutput<any>['render']) => void
    setOutputError: (error: RenderOutput<any>['error']) => void
  },
): void {
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
          setOutputError(error)
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
        setOutputRender(assemblyResult.data)
      } else {
        setOutputError(assemblyResult.error)
      }
    })()
  }, [jsCode, setOutputRender, setOutputError])
}
