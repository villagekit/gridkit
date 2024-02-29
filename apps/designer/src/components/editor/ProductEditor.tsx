import { useProductContext } from '@/context/product'
import { EditorProvider, useEditorContext } from '@/context/editor'

import { TypeScriptEditor } from './TypeScriptEditor'
import { useEffect } from 'react'

interface ProductEditorProps {}

export function ProductEditor(_props: ProductEditorProps) {
  return (
    <EditorProvider>
      <EditorWithContext />
    </EditorProvider>
  )
}

function EditorWithContext() {
  const productContext = useProductContext()
  const editorContext = useEditorContext()

  useEffect(() => {
    const code = productContext?.file?.code
    const setCodeToLoad = editorContext?.setCodeToLoad
    if (code == null || setCodeToLoad == null) return
    setCodeToLoad(code)
  }, [productContext?.file?.code, editorContext?.setCodeToLoad])

  if (productContext == null) return null

  const { type, language } = productContext.file

  if (language === 'typescript') {
    return <TypeScriptEditor productType={type} />
  }

  throw new Error(`Unexpected product assembly file language: ${language}`)
}
