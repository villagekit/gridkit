import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { ipcLink } from 'electron-trpc/renderer'

import { client } from '@/client'
import { ProductProvider } from '@/context/product'
import { WorkspaceProvider, useWorkspaceContext } from '@/context/workspace'
import { WorkspacesProvider, useWorkspacesContext } from '@/context/workspaces'
import { ChakraProvider, theme } from '@villagekit/ui'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

export interface LayoutProps {
  children: React.ReactNode
}
export function AppLayout({ children }: LayoutProps) {
  return (
    <ProvidersLayout>
      <ContentLayout>{children}</ContentLayout>
    </ProvidersLayout>
  )
}

export function ProvidersLayout({ children }: LayoutProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            throwOnError: true,
          },
        },
      }),
  )
  const [trpcClient] = useState(() =>
    client.createClient({
      links: [ipcLink()],
    }),
  )

  return (
    <ChakraProvider theme={theme}>
      <client.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <ReactQueryDevtools initialIsOpen />
          {children}
        </QueryClientProvider>
      </client.Provider>
    </ChakraProvider>
  )
}

export function ContentLayout({ children }: LayoutProps) {
  return (
    <WorkspacesProvider>
      <WorkspaceLayout>{children}</WorkspaceLayout>
    </WorkspacesProvider>
  )
}

export function WorkspaceLayout({ children }: LayoutProps) {
  const { activeWorkspace } = useWorkspacesContext()

  if (activeWorkspace == null) return children

  return (
    <WorkspaceProvider workspace={activeWorkspace}>
      <ProductLayout>{children}</ProductLayout>
    </WorkspaceProvider>
  )
}

export function ProductLayout({ children }: LayoutProps) {
  const { activeProductIndex } = useWorkspaceContext()

  if (activeProductIndex == null) return children

  return <ProductProvider productPath={activeProductIndex.path}>{children}</ProductProvider>
}
