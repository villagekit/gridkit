import { QuickJSWASMModule, getQuickJS } from 'quickjs-emscripten'
import { useEffect, useState } from 'react'

function TypeScriptEval() {
  const [quickjs, setQuickJs] = useState<QuickJSWASMModule | null>(null)

  useEffect(() => {
    ;(async () => {
      setQuickJs(await getQuickJS())
    })()
  }, [])

  const vm = 
}
