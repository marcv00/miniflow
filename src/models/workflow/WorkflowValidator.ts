import type { FlowNode, FlowEdge, CommandConfig, HttpRequestConfig, ConditionalConfig } from "./types"

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

const isValidJson = (s: string) => {
  const t = (s ?? "").trim()
  if (!t) return true // vacío lo consideramos OK
  try {
    JSON.parse(t)
    return true
  } catch {
    return false
  }
}

const isValidHttpUrl = (url: string) => {
  const u = (url ?? "").trim()
  if (!u) return false
  return /^https?:\/\/.+/i.test(u)
}

const edgeBranch = (e: FlowEdge): "TRUE" | "FALSE" | null => {
  const sh = e.sourceHandle ?? undefined
  if (sh === "TRUE" || sh === "FALSE") return sh

  const lbl = e.label
  if (typeof lbl === "string" && (lbl === "TRUE" || lbl === "FALSE")) return lbl

  return null
}



export const validate = (nodes: FlowNode[], edges: FlowEdge[]) => {
  const errors: string[] = []

  // START: exactamente 1
  const starts = nodes.filter(n => n.type === "start")
  if (starts.length !== 1) {
    errors.push("Debe existir exactamente 1 nodo START.")
  }

  // END: al menos 1 (si quieres que sea obligatorio)
  const ends = nodes.filter(n => n.type === "end")
  if (ends.length < 1) {
    errors.push("Debe existir al menos 1 nodo END.")
  }

  // Ciclos
  if (detectCycle(nodes, edges)) {
    errors.push("No se permite ciclos en el workflow.")
  }

  // Alcanzables desde START
  const startId = starts[0]?.id ?? null
  const reach = reachableFrom(startId, nodes, edges)

  const unreachable = nodes.filter(n => startId && !reach[n.id])
  if (unreachable.length) {
    errors.push("Hay nodos no alcanzables desde START.")
  }

  // Reglas por nodo
  nodes.forEach(n => {
  // COMMAND
  if (n.type === "command") {
    const cfg = n.data.config as CommandConfig
    if (!String(cfg.command ?? "").trim()) {
      errors.push(`COMMAND sin comando (node ${n.id}).`)
    }
  }

  // HTTP_REQUEST
  if (n.type === "http_request") {
    const cfg = n.data.config as HttpRequestConfig

    if (!isValidHttpUrl(cfg.url)) {
      errors.push(`HTTP_REQUEST con URL inválida o vacía (node ${n.id}).`)
    }

    if (!Number.isFinite(cfg.timeoutMs) || cfg.timeoutMs <= 0) {
      errors.push(`HTTP_REQUEST timeout inválido (node ${n.id}).`)
    }

    if (!Number.isFinite(cfg.retries) || cfg.retries < 0) {
      errors.push(`HTTP_REQUEST retries inválido (node ${n.id}).`)
    }

    if (!isValidJson(cfg.headersJson)) {
      errors.push(`HTTP_REQUEST Headers no es JSON válido (node ${n.id}).`)
    }
    if (!isValidJson(cfg.queryParamsJson)) {
      errors.push(`HTTP_REQUEST Query Params no es JSON válido (node ${n.id}).`)
    }
    if (!isValidJson(cfg.bodyJson)) {
      errors.push(`HTTP_REQUEST Body no es JSON válido (node ${n.id}).`)
    }
  }

  // CONDITIONAL
  if (n.type === "conditional") {
    const cfg = n.data.config as ConditionalConfig

    if (!String(cfg.leftPath ?? "").trim()) {
      errors.push(`CONDITIONAL Left (path) vacío (node ${n.id}).`)
    }
    if (!String(cfg.rightValue ?? "").trim()) {
      errors.push(`CONDITIONAL Right (valor) vacío (node ${n.id}).`)
    }

    const out = edges.filter(e => e.source === n.id)
    const hasTrue = out.some(e => edgeBranch(e) === "TRUE")
    const hasFalse = out.some(e => edgeBranch(e) === "FALSE")

    if (!hasTrue || !hasFalse) {
      errors.push(`CONDITIONAL debe tener 2 salidas: TRUE y FALSE (node ${n.id}).`)
    }
  }

  // END no debe tener salidas
  if (n.type === "end") {
    const out = edges.filter(e => e.source === n.id)
    if (out.length > 0) {
      errors.push(`END no debe tener conexiones de salida (node ${n.id}).`)
    }
  }
})


  return errors
}
