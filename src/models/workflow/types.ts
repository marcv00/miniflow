import type { Node, Edge } from "reactflow"

export type NodeType = "start" | "http_request" | "command" | "conditional" | "end"

export type StartConfig = Record<string, never>
export type EndConfig = Record<string, never>

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export interface HttpRequestConfig {
  method: HttpMethod
  url: string
  headersJson: string
  queryParamsJson: string
  bodyJson: string
  timeoutMs: number
  retries: number
  contextKey: string
}

export interface CommandConfig {
  command: string
  args: string
  outputKey?: string
}

export interface ConditionalConfig {
  leftPath: string
  op: "==" | "!=" | ">" | "<" | "contains"
  rightValue: string
}

export type ConfigByType = {
  start: StartConfig
  http_request: HttpRequestConfig
  command: CommandConfig
  conditional: ConditionalConfig
  end: EndConfig
}

export type NodeData<T extends NodeType = NodeType> = {
  type: T 
  label: string
  config: ConfigByType[T]
}

export type FlowNode<T extends NodeType = NodeType> = Node<NodeData<T>, T>
export type FlowEdge = Edge


export interface Workflow {
  id: string
  name: string
  description: string
  nodes: FlowNode[]
  edges: FlowEdge[]
}
