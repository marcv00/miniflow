import type { Node, Edge } from "reactflow"

export type NodeType = "start" | "http_request" | "conditional" | "command" | "end"

export type ErrorPolicy = "STOP_ON_FAIL" | "CONTINUE_ON_FAIL"

export interface CommandConfig {
  command: string
  scriptPath?: string
  args: string
  outputKey?: string
  envVars?: string
  cwd?: string
  timeoutMs?: number
  captureOutput?: string
  errorPolicy?: ErrorPolicy
}

export interface HttpRequestConfig {
  method: string
  url: string
  timeoutMs: number
  retries: number
  errorPolicy: ErrorPolicy
  headers?: string
  queryParams?: string
  body?: string
  map?: {
    status?: string
    payload?: string
  }
}

export interface ConditionalConfig {
  condition: string
  leftOperand?: string
  operator?: string
  rightOperand?: string
}

export type NodeConfig =
  | CommandConfig
  | HttpRequestConfig
  | ConditionalConfig
  | Record<string, never>

export interface NodeData {
  label: string
  config?: NodeConfig
}

export type FlowNode = Node<NodeData, NodeType>
export type FlowEdge = Edge

export interface Workflow {
  id: string
  name: string
  description: string
  nodes: FlowNode[]
  edges: FlowEdge[]
  lastRunAt?: string
  validationStatus?: 'valid' | 'invalid' | 'pending'
}
