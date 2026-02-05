import type { Node, Edge } from "reactflow"

export type NodeType = "start" | "command"

export interface CommandConfig {
  command: string
  args: string
  outputKey?: string
}

export interface NodeData {
  label: string
  config?: CommandConfig
}

export type FlowNode = Node<NodeData, NodeType>
export type FlowEdge = Edge

export interface Workflow {
  id: string
  name: string
  description: string
  nodes: FlowNode[]
  edges: FlowEdge[]
}
