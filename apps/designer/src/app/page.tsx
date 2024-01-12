'use client'

import { useCallback, useEffect, useState } from 'react'
import { open } from '@tauri-apps/api/dialog'

import { useWorkspacesContext } from '../context/workspaces'

interface WorkspaceConfig {
  path: string
}

export default function Landing() {
  const { workspaces, addWorkspace, removeWorkspace } = useWorkspacesContext()

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
            <li id={workspace.path}>
              <div>
                <div>{workspace.path}</div>
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
