import { useEffect, useState } from 'react'
import initSwc, { transformSync } from '@swc/wasm-web'

import { RenderOutput } from './'
import { useDesignAssemblyJavaScriptInner } from './javascript'

export function useDesignAssemblyTypeScript(tsCode: string): RenderOutput<any> {
  const [isSwcInitialized, setSwcInitialized] = useState(false)
  useEffect(() => {
    initSwc().then(() => setSwcInitialized(true))
  }, [])

  const [jsCode, setJsCode] = useState<string | null>(null)
  const [outputRender, setOutputRender] = useState<RenderOutput<any>['render']>(null)
  const [outputError, setOutputError] = useState<RenderOutput<any>['error']>(null)

  useEffect(() => {
    if (!isSwcInitialized) return

    let tsTransformOutput
    try {
      tsTransformOutput = transformSync(tsCode, {})
    } catch (error) {
      if (error instanceof Error || typeof error === 'string') {
        console.error(error)
        setOutputError(error)
        return
      } else {
        throw error
      }
    }
    setJsCode(tsTransformOutput.code)
  }, [tsCode, isSwcInitialized])

  useDesignAssemblyJavaScriptInner(jsCode, { setOutputRender, setOutputError })

  return {
    render: outputRender,
    error: outputError,
  }
}
