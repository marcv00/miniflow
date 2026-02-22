import type { FlowNode, FlowEdge, ValidationReport, ValidationIssue } from "./types"

/* ── helpers ── */

const buildAdj = (nodes: FlowNode[], edges: FlowEdge[]) => {
  const adj: Record<string, string[]> = {}
  nodes.forEach(n => { adj[n.id] = [] })
  edges.forEach(e => { if (adj[e.source]) adj[e.source].push(e.target) })
  return adj
}

const detectCycle = (nodes: FlowNode[], edges: FlowEdge[]) => {
  const adj = buildAdj(nodes, edges)
  const color: Record<string, 0 | 1 | 2> = {}
  let has = false

  nodes.forEach(n => { color[n.id] = 0 })

  const dfs = (u: string) => {
    if (has) return
    color[u] = 1
    for (const v of adj[u] || []) {
      if (color[v] === 1) { has = true; return }
      if (color[v] === 0) dfs(v)
    }
    color[u] = 2
  }

  nodes.forEach(n => { if (color[n.id] === 0) dfs(n.id) })
  return has
}

const reachableFrom = (startId: string | null, nodes: FlowNode[], edges: FlowEdge[]) => {
  const adj = buildAdj(nodes, edges)
  const vis: Record<string, boolean> = {}
  const q: string[] = []
  nodes.forEach(n => { vis[n.id] = false })
  if (startId) { vis[startId] = true; q.push(startId) }
  while (q.length) {
    const u = q.shift()!
    for (const v of adj[u] || []) {
      if (!vis[v]) { vis[v] = true; q.push(v) }
    }
  }
  return vis
}

const edgeLabel = (e: any) => {
  const raw = (e.label || e.sourceHandle || "").toString()
  return raw.trim().toUpperCase()
}

const nodeLabel = (n: FlowNode) => n.data?.label || n.type?.toUpperCase() || n.id

/* ── main validator ── */
export const validate = (nodes: FlowNode[], edges: FlowEdge[]): ValidationReport => {
  const issues: ValidationIssue[] = []
  const push = (severity: ValidationIssue["severity"], message: string, nodeId?: string, action?: ValidationIssue["action"]) => {
    issues.push({ severity, message, nodeId, action: action ?? (nodeId ? "focus" : "none") })
  }

  /* RF-A21 — exactly one START */
  const starts = nodes.filter(n => n.type === "start")
  if (starts.length === 0) {
    push("error", "Debe existir exactamente 1 nodo START.")
  } else if (starts.length > 1) {
    starts.slice(1).forEach(n => push("error", `Solo puede haber un nodo START (nodo "${nodeLabel(n)}" es duplicado).`, n.id))
  }

  /* RF-A22 — no cycles */
  if (detectCycle(nodes, edges)) {
    push("error", "No se permiten ciclos en el workflow.")
  }

  /* RF-A23 — all reachable from START */
  const startId = starts[0]?.id ?? null
  const reach = reachableFrom(startId, nodes, edges)
  nodes.filter(n => startId && !reach[n.id]).forEach(n => {
    push("warning", `El nodo "${nodeLabel(n)}" no es alcanzable desde START.`, n.id)
  })

  /* END checks */
  const ends = nodes.filter(n => n.type === "end")
  if (ends.length !== 1) {
    push("error", "Debe existir exactamente 1 nodo END.")
  }

  const endId = ends[0]?.id ?? null
  if (endId) {
    const endOut = edges.filter(e => e.source === endId)
    if (endOut.length) {
      push("error", "El nodo END no debe tener salidas.", endId)
    }

    /* reverse-reachability to END */
    const rev: Record<string, string[]> = {}
    nodes.forEach(n => { rev[n.id] = [] })
    edges.forEach(e => { if (rev[e.target]) rev[e.target].push(e.source) })

    const canReachEnd: Record<string, boolean> = {}
    nodes.forEach(n => { canReachEnd[n.id] = false })
    const q: string[] = [endId]
    canReachEnd[endId] = true
    while (q.length) {
      const u = q.shift()!
      for (const v of rev[u] || []) {
        if (!canReachEnd[v]) { canReachEnd[v] = true; q.push(v) }
      }
    }
    nodes.filter(n => !canReachEnd[n.id]).forEach(n => {
      push("warning", `El nodo "${nodeLabel(n)}" no llega al nodo END.`, n.id)
    })

    const terminals = nodes.filter(n => edges.filter(e => e.source === n.id).length === 0)
    terminals.filter(n => n.type !== "end").forEach(n => {
      push("error", `Solo END puede ser un nodo terminal (sin salidas). Nodo "${nodeLabel(n)}" no tiene salidas.`, n.id)
    })
  }

  /* RF-A24 — minimum config per type */
  nodes.forEach(n => {
    const cfg: any = n.data?.config || {}

    if (n.type === "http_request") {
      if (!String(cfg.url || "").trim()) push("error", `HTTP_REQUEST "${nodeLabel(n)}" sin URL.`, n.id)
      if (!String(cfg.method || "").trim()) push("error", `HTTP_REQUEST "${nodeLabel(n)}" sin método.`, n.id)
      const timeout = Number(cfg.timeoutMs)
      if (cfg.timeoutMs !== undefined && (!Number.isFinite(timeout) || timeout <= 0)) push("error", `HTTP_REQUEST "${nodeLabel(n)}" timeout inválido.`, n.id)
      const retries = Number(cfg.retries)
      if (cfg.retries !== undefined && (!Number.isFinite(retries) || retries < 0)) push("error", `HTTP_REQUEST "${nodeLabel(n)}" retries inválido.`, n.id)
    }

    /* RF-A25 — structural rules by type */
    if (n.type === "conditional") {
      // Accept either legacy "condition" string OR structured operands
      const hasLegacy = String(cfg.condition || "").trim()
      const hasStructured = String(cfg.leftOperand || "").trim() && String(cfg.operator || "").trim()
      if (!hasLegacy && !hasStructured) {
        push("error", `CONDITIONAL "${nodeLabel(n)}" sin condición.`, n.id)
      }
      const outs = edges.filter(e => e.source === n.id)
      const labels = outs.map(edgeLabel)
      const hasTrue = labels.includes("TRUE")
      const hasFalse = labels.includes("FALSE")
      if (!(hasTrue && hasFalse && outs.length === 2)) {
        push("error", `CONDITIONAL "${nodeLabel(n)}" debe tener exactamente 2 salidas: TRUE y FALSE.`, n.id)
      }
    }

    if (n.type === "command") {
      const cmd = String(cfg.command || "").trim()
      if (!cmd) push("error", `COMMAND "${nodeLabel(n)}" sin comando.`, n.id)
      const low = cmd.toLowerCase()
      const isPython = low === "python" || low.startsWith("python ") || low === "python3" || low.startsWith("python3 ")
      if (isPython && !String(cfg.scriptPath || "").trim()) {
        push("error", `COMMAND "${nodeLabel(n)}" python requiere "Ruta script local".`, n.id)
      }
    }
  })

  return {
    isValid: issues.filter(i => i.severity === "error").length === 0,
    issues
  }
}
