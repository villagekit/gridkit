// from: https://gist.github.com/robin-hartmann/ad6ffc19091c9e661542fbf178647047
// issue: https://github.com/electron/forge/issues/2306
// A bundler for locating local packages from workspaces, because Electron Forge does not support NPM workspaces out of the box

import fs from 'node:fs/promises'
import path from 'node:path'
import { findRoot } from '@manypkg/find-root'
// @ts-ignore
import arborist from '@npmcli/arborist'

interface Edge {
  prod: boolean
  workspace: boolean
  to: Node
}

interface Node {
  isLink: boolean
  isWorkspace: boolean
  packageName: string
  location: string
  realpath: string
  target: Node
  edgesOut: Map<string, Edge>
}

const resolveLink = (node: Node): Node => {
  return node.isLink ? resolveLink(node.target) : node
}

const getWorkspaceByPath = (node: Node, realPath: string): Node | undefined => {
  return Array.from(node.edgesOut.values())
    .filter((depEdge) => depEdge.workspace)
    .map((depEdge) => resolveLink(depEdge.to))
    .find((depNode) => depNode.realpath === realPath)
}

const collectProdWorkspaceDeps = (node: Node, seen: Set<Node> = new Set()): Node[] => {
  return Array.from(node.edgesOut.values())
    .filter((depEdge) => depEdge.prod)
    .map((depEdge) => resolveLink(depEdge.to))
    .filter((depNode) => depNode.isWorkspace)
    .filter((depNode) => {
      if (seen.has(depNode)) return false
      seen.add(depNode)
      return true
    })
    .flatMap((depNode) => [depNode, ...collectProdWorkspaceDeps(depNode, seen)])
}

export const bundle = async (source: string, destination: string): Promise<void> => {
  const root = await findRoot(source)
  const rootNode = await new arborist({ path: root.rootDir }).loadActual()
  const sourceNode = getWorkspaceByPath(rootNode, source)

  if (!sourceNode) {
    throw new Error(`Couldn't find source node. [Debug Info] source: ${source} `)
  }

  // console.log('source', source)

  const deps = collectProdWorkspaceDeps(sourceNode)

  for (const dep of deps) {
    // console.log('dep', dep)

    const dest = path.join(destination, 'node_modules', dep.packageName)

    // console.log('cp', dep.realpath, dest)

    await fs.cp(dep.realpath, dest, {
      recursive: true,
      errorOnExist: false,
      dereference: true,
    })
  }
}
