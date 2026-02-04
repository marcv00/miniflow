import type { Workflow, FlowNode, NodeType, ConfigByType } from "./types"

export const uid = () => crypto.randomUUID()

export const defaultConfigByType: ConfigByType = {
  start: {},
  http_request: {
    method: "GET",
    url: "",
    headersJson: "{}",
    queryParamsJson: "{}",
    bodyJson: "{}",
    timeoutMs: 5000,
    retries: 0,
    contextKey: "http"
  },
  command: { command: "", args: "", outputKey: "" },
  conditional: { leftPath: "context.http.status", op: "==", rightValue: "200" },
  end: {}
}

export const emptyWorkflow = (): Workflow => ({
  id: uid(),
  name: "WORKFLOW",
  description: "",
  nodes: [],
  edges: []
})

const clone = <T,>(x: T): T => {
  // Si tu runtime soporta structuredClone, es mejor:
  // return structuredClone(x)
  return JSON.parse(JSON.stringify(x)) as T
}

export const makeNode = <T extends NodeType>(
  type: T,
  position: { x: number; y: number }
): FlowNode<T> => {
  const labelByType: Record<NodeType, string> = {
  start: "Inicio",
  http_request: "Consultar API",
  command: "Ejecutar comando",
  conditional: "Evaluar condición",
  end: "Fin"
}

  return {
    id: uid(),
    type,
    position,
    data: {
      type,
      label: labelByType[type],
      config: clone(defaultConfigByType[type])
    }
  }
}

export const seedWorkflow2 = (): Workflow => {
  const w = emptyWorkflow()
  w.name = "WORKFLOW_2"
  w.description = "ETL simple: extraer → transformar → cargar."

  const n1 = makeNode("start", { x: 80, y: 80 })
  const n2 = makeNode("command", { x: 360, y: 80 })
  const n3 = makeNode("command", { x: 640, y: 80 })
  const n4 = makeNode("command", { x: 920, y: 80 })

  n2.data.label = "Extraer datos"
  n2.data.config.command = "bash"
  n2.data.config.args = "extract.sh"
  n2.data.config.outputKey = "rawData"

  n3.data.label = "Transformar datos"
  n3.data.config.command = "python"
  n3.data.config.args = "transform.py"
  n3.data.config.outputKey = "cleanedData"

  n4.data.label = "Cargar resultados"
  n4.data.config.command = "python"
  n4.data.config.args = "load.py"

  w.nodes = [n1, n2, n3, n4]
  w.edges = [
    { id: uid(), source: n1.id, target: n2.id },
    { id: uid(), source: n2.id, target: n3.id },
    { id: uid(), source: n3.id, target: n4.id }
  ]

  return w
}
