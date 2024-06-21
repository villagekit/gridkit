import { CSSReset, ChakraProvider, extendTheme } from '@villagekit/ui'
import React from 'react'
import { createRoot } from 'react-dom/client'

import { ProductProvider, ProductView } from '@villagekit/product'
import { ProductKitModule } from '@villagekit/product-kit'

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search)

  const metaJson = urlParams.get('meta')
  if (metaJson == null) {
    throw Error('Product.meta not provided!')
  }
  const meta = JSON.parse(metaJson)

  const code = urlParams.get('code')
  if (code == null) {
    throw Error('Product.code not provided!')
  }

  const rootEl = document.getElementById('root')
  const root = createRoot(rootEl as HTMLElement)

  root.render(
    <React.StrictMode>
      <Provider>
        <ProductProvider code={code} meta={meta} Products={[ProductKitModule]}>
          <React.Suspense fallback={null}>
            <ProductView />
          </React.Suspense>
        </ProductProvider>
      </Provider>
    </React.StrictMode>,
  )
})

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: 'transparent',
      },
    },
  },
})

function Provider({
  children,
}: {
  children: React.ReactNode | Array<React.ReactNode>
}) {
  return (
    <ChakraProvider theme={theme}>
      <CSSReset />
      {children}
    </ChakraProvider>
  )
}
