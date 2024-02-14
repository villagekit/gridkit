import { useWorkspacesContext } from '@/context/workspaces'

export default function WorkspaceSelector() {
  const { workspaces, openWorkspace, removeWorkspace, selectWorkspace } = useWorkspacesContext()

  return (
    <main>
      <div>
        <div>Workspaces:</div>
        <ul>
          {workspaces?.map((workspace) => (
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
        <button type="button" onClick={openWorkspace}>
          Open new workspace
        </button>
      </div>
    </main>
  )
}
