'use client'

import { ProductProvider } from '@/context/product'
import { WorkspaceProvider, useWorkspaceContext } from '@/context/workspace'
import { WorkspacesProvider, useWorkspacesContext } from '@/context/workspaces'
import { ChakraProvider, theme } from '@villagekit/ui'
import { useEffect } from 'react'
import WebGL from 'three/addons/capabilities/WebGL'

export interface LayoutProps {
  children: React.ReactNode
}
export function AppLayout({ children }: LayoutProps) {
  useEffect(() => {
    const isWebGLAvailable = WebGL.isWebGL2Available()
    console.log('is web gl available', isWebGLAvailable)
    if (!isWebGLAvailable) {
      console.log('web gl error', WebGL.getWebGLErrorMessage())
    }
  }, [])

  return (
    <ChakraProvider theme={theme}>
      <WorkspacesLayout>
        <WorkspaceLayout>
          <ProductLayout>{children}</ProductLayout>
        </WorkspaceLayout>
      </WorkspacesLayout>
    </ChakraProvider>
  )
}

export function WorkspacesLayout({ children }: LayoutProps) {
  return <WorkspacesProvider>{children}</WorkspacesProvider>
}

export function WorkspaceLayout({ children }: LayoutProps) {
  const { activeWorkspace } = useWorkspacesContext()

  if (activeWorkspace == null) return children

  return <WorkspaceProvider workspace={activeWorkspace}>{children}</WorkspaceProvider>
}

export function ProductLayout({ children }: LayoutProps) {
  const { activeProductIndex } = useWorkspaceContext()

  if (activeProductIndex == null) return children

  return <ProductProvider productPath={activeProductIndex.path}>{children}</ProductProvider>
}
