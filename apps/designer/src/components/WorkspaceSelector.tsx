'use client'

import { useCallback } from 'react'
import { open } from '@tauri-apps/api/dialog'

import { useWorkspacesContext } from '@/context/workspaces'
import { useWorkspaceContext } from '@/context/workspace'

export default function WorkspaceSelector() {
  const { workspaces, addWorkspace, removeWorkspace } = useWorkspacesContext()
  const { selectWorkspace } = useWorkspaceContext()

  const handleAddWorkspace = useCallback(() => {
    ;(async () => {
      const selectedDirectory = await open({
        directory: true,
        multiple: false,
      })
      if (typeof selectedDirectory !== 'string') return
      addWorkspace(selectedDirectory)
    })()
  }, [addWorkspace])

  return (
    <main>
      <div>
        <div>Workspaces:</div>
        <ul>
          {workspaces.map((workspace) => (
            <li key={workspace.path}>
              <div>
                <div>
                  <button type="button" onClick={() => selectWorkspace(workspace.path)}>
                    {workspace.path}
                  </button>
                </div>
                <button type="button" onClick={() => removeWorkspace(workspace.path)}>
                  X
                </button>
              </div>
            </li>
          ))}
        </ul>
        <button type="button" onClick={handleAddWorkspace}>
          Open new workspace
        </button>
      </div>
    </main>
  )
}
