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
  const { setCodeToLoad, setParentEl, setLanguageExtensions } = useEditorContext()

  useEffect(() => {
    const code = productContext?.file?.code
    if (code == null || setCodeToLoad == null) return
    setCodeToLoad(code)
  }, [productContext?.file?.code, setCodeToLoad])

  useEffect(() => {
    if (productContext == null) return
    const { language } = productContext.file

    if (language === 'typescript') {
      getTypeScriptExtensions().then((languageExtensions) => {
        setLanguageExtensions(languageExtensions)
      })
    } else {
      throw new Error(`Unexpected product assembly file language: ${language}`)
    }
  }, [productContext?.file.language])

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
