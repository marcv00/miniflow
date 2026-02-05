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

const reachableFrom = (startId: string | null, nodes: FlowNode[], edges: FlowEdge[]) => {
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

const edgeLabel = (e: any) => {
  const raw = (e.label || e.sourceHandle || "").toString()
  return raw.trim().toUpperCase()
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

  const ends = nodes.filter(n => n.type === "end")
  if (ends.length !== 1) {
    errors.push("Debe existir exactamente 1 nodo END.")
  }

  const endId = ends[0]?.id ?? null
  if (endId) {
    const endOut = edges.filter(e => e.source === endId)
    if (endOut.length) {
      errors.push("El nodo END no debe tener salidas.")
    }

    const rev: Record<string, string[]> = {}
    nodes.forEach(n => { rev[n.id] = [] })
    edges.forEach(e => {
      if (rev[e.target]) rev[e.target].push(e.source)
    })

    const canReachEnd: Record<string, boolean> = {}
    nodes.forEach(n => { canReachEnd[n.id] = false })

    const q: string[] = [endId]
    canReachEnd[endId] = true

    while (q.length) {
      const u = q.shift()!
      for (const v of rev[u] || []) {
        if (!canReachEnd[v]) {
          canReachEnd[v] = true
          q.push(v)
        }
      }
    }

    const notEnding = nodes.filter(n => !canReachEnd[n.id])
    if (notEnding.length) {
      errors.push("Hay nodos que no llegan al nodo END.")
    }

    const terminals = nodes.filter(n => edges.filter(e => e.source === n.id).length === 0)
    const badTerminals = terminals.filter(n => n.type !== "end")
    if (badTerminals.length) {
      errors.push("Solo END puede ser un nodo terminal (sin salidas).")
    }
  }

  nodes.forEach(n => {
    const cfg: any = n.data?.config || {}

    if (n.type === "http_request") {
      if (!String(cfg.url || "").trim()) errors.push(`HTTP_REQUEST sin URL (node ${n.id}).`)
      if (!String(cfg.method || "").trim()) errors.push(`HTTP_REQUEST sin método (node ${n.id}).`)
      const timeout = Number(cfg.timeoutMs)
      if (!Number.isFinite(timeout) || timeout <= 0) errors.push(`HTTP_REQUEST timeout inválido (node ${n.id}).`)
      const retries = Number(cfg.retries)
      if (!Number.isFinite(retries) || retries < 0) errors.push(`HTTP_REQUEST retries inválido (node ${n.id}).`)
    }

    if (n.type === "conditional") {
      if (!String(cfg.condition || "").trim()) errors.push(`CONDITIONAL sin condición (node ${n.id}).`)
      const outs = edges.filter(e => e.source === n.id)
      const labels = outs.map(edgeLabel)
      const hasTrue = labels.includes("TRUE")
      const hasFalse = labels.includes("FALSE")
      if (!(hasTrue && hasFalse && outs.length === 2)) {
        errors.push(`CONDITIONAL debe tener 2 salidas: TRUE y FALSE (node ${n.id}).`)
      }
    }

    if (n.type === "command") {
      if (!String(cfg.command || "").trim()) {
        errors.push(`COMMAND sin comando (node ${n.id}).`)
      }
    }
  })

  return errors
}
