import {
  Box,
  Button,
  Flex,
  HStack,
  Heading,
  List,
  ListIcon,
  ListItem,
  Tooltip,
  VStack,
} from '@villagekit/ui'

import { useWorkspaceContext } from '@/context/workspace'
import { Workspace, useWorkspacesContext } from '@/context/workspaces'
import { useMemo } from 'react'
import { FaChevronRight } from 'react-icons/fa'

interface WorkspaceLayoutProps {
  children: React.ReactNode
}

export function WorkspaceLayout(props: WorkspaceLayoutProps) {
  const { children } = props

  const { activeWorkspace } = useWorkspacesContext()
  const { productIndexes, selectProductId } = useWorkspaceContext()

  if (activeWorkspace == null) {
    throw new Error('Unexpected: activeWorkspace is null')
  }

  const activeWorkspaceName = useMemo(() => getWorkspaceName(activeWorkspace), [activeWorkspace])

  return (
    <Flex sx={{ flexDirection: 'row', width: '100%' }}>
      <VStack sx={{ width: '6xl', paddingY: 4, paddingX: 2 }}>
        <Tooltip label={activeWorkspace.path}>
          <Box>
            <Heading as="h2" sx={{ fontSize: 'lg', fontWeight: 'bold' }}>
              {activeWorkspaceName}
            </Heading>
          </Box>
        </Tooltip>
        <VStack>
          <List>
            {productIndexes?.map((productIndex) => (
              <ListItem
                key={productIndex.path}
                sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
              >
                <ListIcon as={FaChevronRight} />
                <HStack>
                  <Button
                    variant="toolbar"
                    onClick={() => selectProductId(productIndex.id)}
                    sx={{ fontSize: 'md' }}
                  >
                    {productIndex.id}
                  </Button>
                  {/*
                <button type="button" onClick={() => removeproductName(productName.name)}>
                  X
                </button>
                */}
                </HStack>
              </ListItem>
            ))}
          </List>
          {/*
        <button type="button" onClick={handleCreateproductName}>
          Create new productName
        </button>
        */}
        </VStack>
      </VStack>
      {children}
    </Flex>
  )
}

const workspaceNameRe = /^.*[\\\/](.+)/
function getWorkspaceName(workspace: Workspace) {
  const { path } = workspace
  return path.match(workspaceNameRe)?.[1] || path
}
