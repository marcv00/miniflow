import type { FlowNode, FlowEdge } from "./types"

const buildAdj = (nodes: FlowNode[], edges: FlowEdge[]) => {
  const adj: Record<string, string[]> = {}

  nodes.forEach(n => {
    adj[n.id] = []
  })

  edges.forEach(e => {
    if (adj[e.source]) adj[e.source].push(e.target)
  })

  return adj
}

const detectCycle = (nodes: FlowNode[], edges: FlowEdge[]) => {
  const adj = buildAdj(nodes, edges)
  const color: Record<string, 0 | 1 | 2> = {}
  let has = false

  nodes.forEach(n => {
    color[n.id] = 0
  })

  const dfs = (u: string) => {
    if (has) return
    color[u] = 1

    for (const v of adj[u] || []) {
      if (color[v] === 1) {
        has = true
        return
      }
      if (color[v] === 0) dfs(v)
    }

    color[u] = 2
  }

  nodes.forEach(n => {
    if (color[n.id] === 0) dfs(n.id)
  })

  return has
}

const reachableFrom = (
  startId: string | null,
  nodes: FlowNode[],
  edges: FlowEdge[]
) => {
  const adj = buildAdj(nodes, edges)
  const vis: Record<string, boolean> = {}
  const q: string[] = []

  nodes.forEach(n => {
    vis[n.id] = false
  })

  if (startId) {
    vis[startId] = true
    q.push(startId)
  }

  while (q.length) {
    const u = q.shift()!
    for (const v of adj[u] || []) {
      if (!vis[v]) {
        vis[v] = true
        q.push(v)
      }
    }
  }

  return vis
}

export const validate = (nodes: FlowNode[], edges: FlowEdge[]) => {
  const errors: string[] = []

  const starts = nodes.filter(n => n.type === "start")
  if (starts.length !== 1) {
    errors.push("Debe existir exactamente 1 nodo START.")
  }

  if (detectCycle(nodes, edges)) {
    errors.push("No se permite ciclos en el workflow.")
  }

  const startId = starts[0]?.id ?? null
  const reach = reachableFrom(startId, nodes, edges)

  const unreachable = nodes.filter(n => startId && !reach[n.id])
  if (unreachable.length) {
    errors.push("Hay nodos no alcanzables desde START.")
  }

  nodes.forEach(n => {
    if (n.type === "command") {
      const cfg = n.data?.config
      if (!cfg || !cfg.command.trim()) {
        errors.push(`COMMAND sin comando (node ${n.id}).`)
      }
    }
  })

  return errors
}
