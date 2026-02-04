import { useEffect, useMemo, useState } from "react"
import {
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type NodeMouseHandler,
  MarkerType
} from "reactflow"

import { makeNode, emptyWorkflow } from "../models/workflow/WorkflowFactory"
import { validate } from "../models/workflow/WorkflowValidator"
import { useWorkflowStorage } from "./useWorkflowStorage"
import { useWorkflowIO } from "./useWorkflowIO"

import type { FlowNode, Workflow, NodeType, ConfigByType, NodeData} from "../models/workflow/types";

type NodePatch<T extends NodeType = NodeType> = {
  label?: string
  config?: Partial<ConfigByType[T]>
}

export function useWorkflowViewModel() {
  const { workflows, currentId, setCurrentId, persist, remove } = useWorkflowStorage()
  const current = useMemo<Workflow | null>(
  () => workflows.find(w => w.id === currentId) ?? null,
  [workflows, currentId]
);


const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>(current?.nodes ?? [])
const [edges, setEdges, onEdgesChange] = useEdgesState(current?.edges ?? [])


  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [name, setName] = useState(current?.name ?? "WORKFLOW")
  const [description, setDescription] = useState(current?.description ?? "")
  const [errors, setErrors] = useState<string[]>([])
  const [hasValidated, setHasValidated] = useState(false)

  const { fileInputRef, exportJson, exportJava, onImportFile, openImport } = useWorkflowIO(persist)

  useEffect(() => {
    if (!current) return
    setName(current.name)
    setDescription(current.description)
    setNodes(current.nodes)
    setEdges(current.edges)
    setErrors([])
    setHasValidated(false)
    setSelectedNodeId(null)
  }, [current, setNodes, setEdges])

  const selectedNode = useMemo<FlowNode | null>(
  () => (nodes.find(n => n.id === selectedNodeId) as FlowNode) ?? null,
  [nodes, selectedNodeId]
)

  const getCurrentWorkflowData = (): Workflow => ({
    id: currentId ?? crypto.randomUUID(),
    name: name.trim() || "WORKFLOW",
    description,
    nodes: nodes as FlowNode[],
    edges
  })

  const actions = {
    saveCurrent: () => persist(getCurrentWorkflowData()),
    deleteCurrent: () => { if (currentId) remove(currentId) },

    validateNow: () => {
      setErrors(validate(nodes as FlowNode[], edges))
      setHasValidated(true)
    },

    addNode: (type: NodeType) => {
      setNodes(nds => nds.concat(makeNode(type, { x: 250, y: 250 })))
    },

    // ✅ aquí también mejor: al conectar, poner label TRUE/FALSE automáticamente
    onConnect: (params: Connection) =>
  setEdges(eds =>
    addEdge(
      {
        ...params,
        label: params.sourceHandle ?? "",
        markerEnd: { type: MarkerType.ArrowClosed },
        labelStyle: {
          fill: params.sourceHandle === "TRUE" ? "#22c55e" : "#ef4444",
          fontWeight: 800,
          fontSize: 12,
        },
      },
      eds
    )
  ),


    updateSelectedNode: (patch: NodePatch) => {
  setNodes(nds =>
    nds.map(n => {
      if (n.id !== selectedNodeId) return n

      return {
        ...n,
        data: {
          ...n.data,
          label: patch.label !== undefined ? patch.label : n.data.label,
          config:
            patch.config !== undefined
              ? ({ ...(n.data.config as object), ...(patch.config as object) } as any)
              : n.data.config,
        },
      }
    })
  )
}
  }

  const onNodeClick: NodeMouseHandler = (_evt, node) => setSelectedNodeId(node.id)

  return {
    state: { workflows, currentId, nodes, edges, name, description, errors, hasValidated, selectedNode },
    fileInputRef,
    handlers: {
      ...actions,
      setName,
      setDescription,
      setCurrentId,
      onNodesChange,
      onEdgesChange,
      onNodeClick,
      createNewWorkflow: () => persist(emptyWorkflow()),

      exportJson: () => {
        const data = getCurrentWorkflowData()
        persist(data)
        exportJson(data)
      },

      exportJava: () => {
        const data = getCurrentWorkflowData()
        persist(data)
        exportJava(data)
      },

      onImportFile,
      openImport
    }
  }
}
