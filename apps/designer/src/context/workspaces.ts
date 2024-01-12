'use client'

import constate from 'constate'
import { useCallback, useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api'

export interface Workspace {
  path: string
}

export interface WorkspacesState {
  workspaces: Array<Workspace>
  addWorkspace: (workspacePath: string) => void
  removeWorkspace: (workspacePath: string) => void
}

function useWorkspaces(): WorkspacesState {
  const [workspaces, setWorkspaces] = useState<Array<Workspace>>([])

  useEffect(() => {
    ;(async () => {
      const workspaces = await invoke('list_workspaces')
      setWorkspaces(workspaces as Array<Workspace>)
    })()
  }, [])

  const addWorkspace = useCallback(
    (workspacePath: string) => {
      if (workspaces.find((workspace) => workspace.path === workspacePath)) {
        return
      }

      const newWorkspace = { path: workspacePath }
      const nextWorkspaces = [...workspaces, newWorkspace]
      setWorkspaces(nextWorkspaces)

      invoke('add_workspace', { workspace: newWorkspace })
    },
    [workspaces],
  )

  const removeWorkspace = useCallback(
    (workspacePath: string) => {
      const nextWorkspaces = workspaces.filter((workspace) => workspace.path !== workspacePath)
      setWorkspaces(nextWorkspaces)

      invoke('remove_workspace', { workspacePath })
    },
    [workspaces],
  )

  return {
    workspaces,
    addWorkspace,
    removeWorkspace,
  }
}

export const [WorkspacesProvider, useWorkspacesContext] = constate(useWorkspaces)
