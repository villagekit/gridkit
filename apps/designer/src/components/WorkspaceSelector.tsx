import { useWorkspacesContext } from '@/context/workspaces'
import { Button, Heading, Icon, IconButton, List, ListItem, VStack } from '@villagekit/ui'
import { MdClose } from 'react-icons/md'

export default function WorkspaceSelector() {
  const { workspaces, openWorkspace, removeWorkspace, selectWorkspace } = useWorkspacesContext()

  return (
    <VStack sx={{ maxWidth: { md: 'container.lg', base: 'full' } }}>
      <Heading as="h2">Workspaces:</Heading>
      <List>
        {workspaces?.map((workspace) => (
          <ListItem key={workspace.path}>
            <Button variant="toolbar" onClick={() => selectWorkspace(workspace.path)}>
              {workspace.path}
            </Button>
            <IconButton
              aria-label="Close workspace"
              icon={<Icon as={MdClose} />}
              variant="tertiary"
              onClick={() => removeWorkspace(workspace.path)}
            />
          </ListItem>
        ))}
      </List>
      <Button variant="secondary" onClick={openWorkspace}>
        Open new workspace
      </Button>
    </VStack>
  )
}
