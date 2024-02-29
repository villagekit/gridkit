import { useProductContext } from '@/context/product'

import { TypeScriptEditor } from './TypeScriptEditor'

interface ProductEditorProps {}

export function ProductEditor(_props: ProductEditorProps) {
  const context = useProductContext()

  if (context == null) return null

  const { type, language } = context.file

  if (language === 'typescript') {
    return <TypeScriptEditor productType={type} />
  }

  throw new Error(`Unexpected product assembly file language: ${language}`)
}
