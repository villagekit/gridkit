import { Button, HStack, Heading, List, ListItem, Text, VStack } from '@villagekit/ui'

import { useWorkspaceContext } from '@/context/workspace'
import { useWorkspacesContext } from '@/context/workspaces'

export default function WorkspaceSelector() {
  const { activeWorkspace } = useWorkspacesContext()
  const { productIndexes, selectProductId } = useWorkspaceContext()

  if (activeWorkspace == null) {
    throw new Error('Unexpected: activeWorkspace is null')
  }

  return (
    <VStack sx={{ maxWidth: { md: 'container.lg', base: 'full' } }}>
      <Heading as="h2">
        Workspace: <Text sx={{ fontSize: 'md' }}>{activeWorkspace.path}</Text>
      </Heading>
      <VStack>
        <Heading as="h3">Products:</Heading>
        <List>
          {productIndexes?.map((productIndex) => (
            <ListItem key={productIndex.path}>
              <HStack>
                <Button variant="toolbar" onClick={() => selectProductId(productIndex.id)}>
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
  )
}
