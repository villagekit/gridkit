import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { ipcLink } from 'electron-trpc/renderer'

import { client } from '@/client'
import { ProductProvider } from '@/context/product'
import { WorkspaceProvider, useWorkspaceContext } from '@/context/workspace'
import { WorkspacesProvider, useWorkspacesContext } from '@/context/workspaces'
import { ChakraProvider, theme } from '@villagekit/ui'

export interface LayoutProps {
  children: React.ReactNode
}
export function AppLayout({ children }: LayoutProps) {
  return (
    <ProvidersLayout>
      <WorkspacesLayout>
        <WorkspaceLayout>
          <ProductLayout>{children}</ProductLayout>
        </WorkspaceLayout>
      </WorkspacesLayout>
    </ProvidersLayout>
  )
}

export function ProvidersLayout({ children }: LayoutProps) {
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClient] = useState(() =>
    client.createClient({
      links: [ipcLink()],
    }),
  )

  return (
    <ChakraProvider theme={theme}>
      <client.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </client.Provider>
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
