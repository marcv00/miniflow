import type { Workflow, FlowNode, NodeType } from "./types"

export const uid = () => crypto.randomUUID()

export const defaultConfigByType: Record<NodeType, any> = {
  start: {},
  end: {},
  http_request: {
    method: "GET",
    url: "https://httpbin.org/status/200",
    timeoutMs: 5000,
    retries: 3,
    errorPolicy: "STOP_ON_FAIL",
    fallbackUrls: ["https://jsonplaceholder.typicode.com/todos/1"],
    map: { status: "$.status", payload: "$.body" }
  },
  conditional: {
    condition: "context.status == 200"
  },
  command: { command: "", args: "", outputKey: "" }
}

export const emptyWorkflow = (): Workflow => ({
  id: uid(),
  name: "WORKFLOW",
  description: "",
  nodes: [],
  edges: []
})

export const makeNode = (
  type: NodeType,
  position: { x: number; y: number }
): FlowNode => {
  const label =
    type === "start"
      ? "Inicio"
      : type === "end"
        ? "Fin"
        : type === "http_request"
          ? "Consultar API"
          : type === "conditional"
            ? "Evaluar respuesta"
            : "Ejecutar comando"

  const node: FlowNode = {
    id: uid(),
    type,
    position,
    data: {
      label,
      config: JSON.parse(JSON.stringify(defaultConfigByType[type]))
    }
  }
  return node
}

export const seedWorkflow1 = (): Workflow => {
  const w = emptyWorkflow()
  w.name = "WORKFLOW_1"
  w.description = "Consultar API, decidir por status==200 y ejecutar comandos según resultado."

  const start = makeNode("start", { x: 80, y: 220 })
  const http = makeNode("http_request", { x: 360, y: 220 })
  const cond = makeNode("conditional", { x: 650, y: 220 })
  const ok = makeNode("command", { x: 960, y: 160 })
  const fail = makeNode("command", { x: 960, y: 300 })
  const end = makeNode("end", { x: 1250, y: 230 })

  http.data.label = "Consultar API"
  http.data.config = {
    method: "GET",
    url: "https://httpbin.org/status/200",
    timeoutMs: 5000,
    retries: 3,
    errorPolicy: "STOP_ON_FAIL",
    fallbackUrls: ["https://jsonplaceholder.typicode.com/todos/1"],
    map: { status: "$.status", payload: "$.body" }
  }

  cond.data.label = "Evaluar respuesta"
  cond.data.config = { condition: "context.status == 200" }

  ok.data.label = "Procesar datos"
  ok.data.config = { command: "echo", args: "\"Procesar datos OK\"", outputKey: "" }

  fail.data.label = "Registrar error"
  fail.data.config = { command: "echo", args: "\"Error al consumir API\"", outputKey: "" }

  w.nodes = [start, http, cond, ok, fail, end]
  w.edges = [
    { id: uid(), source: start.id, target: http.id, type: "smoothstep" },
    { id: uid(), source: http.id, target: cond.id, type: "smoothstep" },
    { id: uid(), source: cond.id, sourceHandle: "true", target: ok.id, label: "TRUE", type: "smoothstep" },
    { id: uid(), source: cond.id, sourceHandle: "false", target: fail.id, label: "FALSE", type: "smoothstep" },
    { id: uid(), source: ok.id, target: end.id, type: "smoothstep" },
    { id: uid(), source: fail.id, target: end.id, type: "smoothstep" }
  ]

  return w
}

