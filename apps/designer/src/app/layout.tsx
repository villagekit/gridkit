import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { WorkspacesProvider } from '@/context/workspaces'
import { WorkspaceProvider } from '@/context/workspace'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Village Kit Designer',
  description:
    'Design products using an open ecosystem of modular parts with a focus on peer production and circular economies.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WorkspacesProvider>
          <WorkspaceProvider>{children}</WorkspaceProvider>
        </WorkspacesProvider>
      </body>
    </html>
  )
}
