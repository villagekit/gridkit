import constate from 'constate'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { invoke } from '@tauri-apps/api'

export interface Workspace {
  path: string
}

export interface WorkspacesState {
  workspaces: Array<Workspace>
  addWorkspace: (workspacePath: string) => Promise<void>
  removeWorkspace: (workspacePath: string) => Promise<void>
  activeWorkspace: Workspace | null
  selectWorkspace: (workspacePath: string | null) => void
}

function useWorkspaces(): WorkspacesState {
  const [workspaces, setWorkspaces] = useState<Array<Workspace>>([])
  const [activeWorkspacePath, selectWorkspace] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const workspaces = await invoke('list_workspaces')
      setWorkspaces(workspaces as Array<Workspace>)
    })()
  }, [])

  const activeWorkspace = useMemo(() => {
    if (activeWorkspacePath == null) return null
    return workspaces.find((workspace) => workspace.path === activeWorkspacePath) || null
  }, [activeWorkspacePath, workspaces])

  console.log('activeWorkspacePath', activeWorkspacePath)

  const addWorkspace = useCallback(
    async (workspacePath: string) => {
      if (workspaces.find((workspace) => workspace.path === workspacePath)) {
        return
      }

      const newWorkspace = { path: workspacePath }
      const nextWorkspaces = [...workspaces, newWorkspace]
      setWorkspaces(nextWorkspaces)

      await invoke('add_workspace', { workspace: newWorkspace })
    },
    [workspaces],
  )

  const removeWorkspace = useCallback(
    async (workspacePath: string) => {
      const nextWorkspaces = workspaces.filter((workspace) => workspace.path !== workspacePath)
      setWorkspaces(nextWorkspaces)

      await invoke('remove_workspace', { workspacePath })
    },
    [workspaces],
  )

  return {
    workspaces,
    activeWorkspace,
    selectWorkspace,
    addWorkspace,
    removeWorkspace,
  }
}

export const [WorkspacesProvider, useWorkspacesContext] = constate(useWorkspaces)
