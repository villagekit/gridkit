import { useEffect, useRef } from 'react'
import { Box } from '@villagekit/ui'

import { useProductContext } from '@/context/product'
import { EditorProvider, useEditorContext } from '@/context/editor'
import { getTypeScriptExtensions } from '@/editor/typescript'

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
  const { code: editorCode, setCodeToLoad, setParentEl, setLanguageExtensions } = useEditorContext()

  const productCode = productContext?.file?.code
  useEffect(() => {
    if (productCode == null || setCodeToLoad == null) return
    setCodeToLoad(productCode)
  }, [productCode, setCodeToLoad])

  const setProductCode = productContext?.setCode
  useEffect(() => {
    if (editorCode == null || setProductCode == null) return
    // TODO remove
    if (editorCode == '') return
    setProductCode(editorCode)
  }, [editorCode, setProductCode])

  const language = productContext?.file?.language
  useEffect(() => {
    if (language == null) return
    if (language === 'typescript') {
      getTypeScriptExtensions().then((languageExtensions) => {
        setLanguageExtensions(languageExtensions)
      })
    } else {
      throw new Error(`Unexpected product assembly file language: ${language}`)
    }
  }, [language, setLanguageExtensions])

  const parentRef = useRef(null)
  useEffect(() => {
    setParentEl(parentRef.current)
  }, [setParentEl])

  return (
    <Box
      ref={parentRef}
      sx={{
        width: '100%',
        height: '100vh',

        '.cm-editor': {
          height: '100%',
        },

        '.cm-scroller': {
          height: '100%',
          overflowY: 'auto',
        },
      }}
    />
  )
}
