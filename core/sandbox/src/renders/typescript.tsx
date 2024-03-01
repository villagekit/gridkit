import { useEffect, useState } from 'react'
import initSwc, { transformSync } from '@swc/wasm-web'

import { RendererProps } from './'
import { DesignRendererAssemblyJavaScript } from './javascript'

export function DesignRendererAssemblyTypeScript(props: RendererProps<any> & { code: string }) {
  const { code: tsCode, setRender, setError } = props

  const [isSwcInitialized, setSwcInitialized] = useState(false)
  useEffect(() => {
    initSwc().then(() => setSwcInitialized(true))
  }, [])

  const [jsCode, setJsCode] = useState<string | null>(null)

  useEffect(() => {
    if (!isSwcInitialized) return

    let tsTransformOutput
    try {
      tsTransformOutput = transformSync(tsCode, {
        module: {
          type: 'es6',
          strict: true,
        },
      })
    } catch (error) {
      if (error instanceof Error || typeof error === 'string') {
        console.error(error)
        setError(error)
        return
      } else {
        throw error
      }
    }
    setJsCode(tsTransformOutput.code)
  }, [tsCode, setError, isSwcInitialized])

  return (
    <DesignRendererAssemblyJavaScript code={jsCode} setRender={setRender} setError={setError} />
  )
}
