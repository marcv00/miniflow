import { useEffect, useMemo, useState } from "react";
import { addEdge, useNodesState, useEdgesState, type Connection } from "reactflow";
import { makeNode, emptyWorkflow } from "../models/workflow/WorkflowFactory";
import { validate } from "../models/workflow/WorkflowValidator";
import { useWorkflowStorage } from "./useWorkflowStorage";
import { useWorkflowIO } from "./useWorkFlowIO";
import type { FlowNode, Workflow } from "../models/workflow/types";

export function useWorkflowViewModel() {
  const { workflows, currentId, setCurrentId, persist, remove } = useWorkflowStorage();
  const current = useMemo(() => workflows.find(w => w.id === currentId) ?? null, [workflows, currentId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(current?.nodes ?? []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(current?.edges ?? []);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [name, setName] = useState(current?.name ?? "WORKFLOW");
  const [description, setDescription] = useState(current?.description ?? "");
  const [errors, setErrors] = useState<string[]>([]);
  const [hasValidated, setHasValidated] = useState(false);

  const { fileInputRef, exportJson, exportJava, onImportFile, openImport } = useWorkflowIO(persist);

  useEffect(() => {
    if (!current) return;
    setName(current.name);
    setDescription(current.description);
    setNodes(current.nodes);
    setEdges(current.edges);
    setErrors([]);
    setHasValidated(false);
    setSelectedNodeId(null);
  }, [current, setNodes, setEdges]);

  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);

  // Definimos la lógica de guardado en una constante reutilizable
  const getCurrentWorkflowData = (): Workflow => ({
    id: currentId ?? crypto.randomUUID(),
    name: name.trim() || "WORKFLOW",
    description,
    nodes: nodes as FlowNode[],
    edges
  });

  const actions = {
    saveCurrent: () => {
      persist(getCurrentWorkflowData());
    },
    deleteCurrent: () => {
      if (currentId) remove(currentId);
    },
    validateNow: () => {
      setErrors(validate(nodes as FlowNode[], edges));
      setHasValidated(true);
    },
    addNode: (type: "start" | "command") => {
      setNodes(nds => nds.concat(makeNode(type, { x: 250, y: 250 })));
    },
    onConnect: (params: Connection) => setEdges(eds => addEdge(params, eds)),
    updateSelectedNode: (patch: { label?: string; config?: any }) => {
      setNodes(nds => nds.map(n => {
        if (n.id !== selectedNodeId) return n;
        return {
          ...n,
          data: {
            ...n.data,
            label: patch.label !== undefined ? patch.label : n.data.label,
            config: patch.config !== undefined ? { ...n.data.config, ...patch.config } : n.data.config
          }
        };
      }));
    }
  };

  return {
    state: { workflows, currentId, nodes, edges, name, description, errors, hasValidated, selectedNode },
    refs: { fileInputRef },
    handlers: { 
        ...actions, 
        setName, 
        setDescription, 
        setCurrentId, 
        onNodesChange, 
        onEdgesChange, 
        onNodeClick: (_: any, node: any) => setSelectedNodeId(node.id),
        createNewWorkflow: () => persist(emptyWorkflow()),
        
        
        exportJson: () => {
          const data = getCurrentWorkflowData();
          persist(data); // Auto-guardar antes de exportar
          exportJson(data);
        },
        exportJava: () => {
          const data = getCurrentWorkflowData();
          persist(data); // Auto-guardar antes de exportar
          exportJava(data);
        },
        onImportFile, 
        openImport
    }
  };
}