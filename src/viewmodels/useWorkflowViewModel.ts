import { useEffect, useMemo, useState, useCallback } from "react";
import {
  useNodesState,
  useEdgesState,
  type Connection,
  type NodeMouseHandler,
} from "reactflow";
import { makeNode, emptyWorkflow, seedWorkflow1 } from "../models/workflow/WorkflowFactory";
import { validate } from "../models/workflow/WorkflowValidator";
import { useWorkflowStorage } from "./useWorkflowStorage";
import { useWorkflowIO } from "./useWorkflowIO";
import type { FlowNode, Workflow, NodeType, NodeData } from "../models/workflow/types";
import { buildEnginePayload } from "./helpers/buildEnginePayload";
import { deserializeWorkflow } from "../models/workflow/WorkflowSerializer";
import type { PortableWorkflow } from "../models/workflow/WorkflowSerializer";
import { useWorkflowUIState } from "./helpers/useWorkflowUIState";
import { useRunState, type EngineApiResponse } from "./helpers/useRunState";
import { type NodePatch, mergeConfig } from "./helpers/nodePatch";
import { addStyledEdge } from "./helpers/edgeFactory";

export function useWorkflowViewModel(initialId?: string) {
  const { workflows, currentId, setCurrentId, persist, remove } = useWorkflowStorage();
  useEffect(() => {
    if (initialId && initialId !== currentId) {
      setCurrentId(initialId);
    }
  }, [initialId, currentId, setCurrentId]);

  const current = useMemo(
    () => workflows.find((w) => w.id === currentId) ?? null,
    [workflows, currentId]
  );
  // Tipado para evitar casts
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>(current?.nodes ?? []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(current?.edges ?? []); 
  const flowNodes = useMemo(() => nodes as FlowNode[], [nodes]);
  const ui = useWorkflowUIState(current?.name, current?.description);
  const { syncFromWorkflow, setEditingNodeId, setSelectedNodeId } = ui; 
  const { name, description, selectedNodeId, editingNodeId, validationReport } = ui;
  const run = useRunState();
  const { setRunStatus } = run;
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const { exportJson, exportJava } = useWorkflowIO(persist);
  
  useEffect(() => {
  if (!current) return;
  syncFromWorkflow(current.name, current.description);
  setNodes(current.nodes);
  setEdges(current.edges);
  setRunStatus("idle");
}, [current, setNodes, setEdges, setRunStatus, syncFromWorkflow]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );
  const editingNode = useMemo(
    () => nodes.find((n) => n.id === editingNodeId) || null,
    [nodes, editingNodeId]
  );

  const getCurrentWorkflowData = useCallback((): Workflow => ({
  id: currentId ?? crypto.randomUUID(),
  name: name.trim() || "WORKFLOW",
  description,
  nodes: flowNodes,
  edges
}), [currentId, name, description, flowNodes, edges]);

  const updateNodeById = useCallback(
  (nodeId: string, patch: NodePatch) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== nodeId) return n;

        const nextLabel = patch.label ?? n.data.label;

        const prevConfig = n.data.config;
        const nextConfig = patch.config
          ? mergeConfig(prevConfig, patch.config)
          : prevConfig;

        return {
          ...n,
          data: { ...n.data, label: nextLabel, config: nextConfig }
        };
      })
    );
  },
  [setNodes]
);

  const duplicateNode = useCallback(
    (nodeId: string) => {
      const source = nodes.find((n) => n.id === nodeId);
      if (!source) return;
      if (source.type === "start" && nodes.some((n) => n.type === "start")) return;

      const newNode = makeNode(source.type as NodeType, {
        x: source.position.x + 50,
        y: source.position.y + 50
      });
      const clone = (x: unknown) =>
        typeof structuredClone === "function"
          ? structuredClone(x)
          : JSON.parse(JSON.stringify(x));

      newNode.data = clone(source.data) as FlowNode["data"];
      setNodes((nds) => nds.concat(newNode));
    },
    [nodes, setNodes]
  );

  const deleteNode = useCallback(
      (nodeId: string) => {
        setNodes((nds) => nds.filter((n) => n.id !== nodeId));
        setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
        if (editingNodeId === nodeId) setEditingNodeId(null);
        if (selectedNodeId === nodeId) setSelectedNodeId(null);
      },
      [setNodes, setEdges, editingNodeId, selectedNodeId, setEditingNodeId, setSelectedNodeId] // 👈
    );

  const onNodeClick: NodeMouseHandler = (_, node) => ui.setSelectedNodeId(node.id);
  const onNodeDoubleClick: NodeMouseHandler = (_, node) => ui.setEditingNodeId(node.id);

  const actions = {
    saveCurrent: () => {
      persist(getCurrentWorkflowData());
      setLastSavedAt(new Date());
    },
    deleteCurrent: () => {
      if (currentId) remove(currentId);
    },
    validateNow: () => {
      const report = validate(flowNodes, edges)
      ui.setValidationReport(report);
    },
    closeValidation: () => {
      ui.setValidationReport(null);
    },
    executeNow: async () => {
    const data = getCurrentWorkflowData();

  // 1) Persistencia
  persist(data);
  setLastSavedAt(new Date());

  // 2) Validación
  const report = validate(flowNodes, edges);
  ui.setValidationReport(report);
  if (!report.isValid) return;

  // 3) Reset estado de ejecución
  run.reset();

  // 4) Ejecutar engine
  try {
    const enginePayload = buildEnginePayload(data);
    const res = (await window.electronAPI.runWorkflow(
      JSON.stringify(enginePayload)
    )) as EngineApiResponse;

    run.apply(res);
  } catch (e: unknown) {
  run.setRunStderr(e instanceof Error ? e.message : String(e));
  run.setRunStatus("error");
  }
},
    addNode: (type: NodeType, position?: { x: number; y: number }) => {
      if (type === "start" && nodes.some((n) => n.type === "start")) return;
      const bump = (nodes?.length || 0) * 30;
      const pos = position ?? { x: 260 + bump, y: 220 + bump };
      setNodes((nds) => nds.concat(makeNode(type, pos)));
    },
    onConnect: (params: Connection) => setEdges((eds) => addStyledEdge(params, eds)),
    updateSelectedNode: (patch: NodePatch) => {
      if (selectedNodeId) updateNodeById(selectedNodeId, patch);
    },
    updateNodeById,
    duplicateNode,
    deleteNode
  };

  return {
    state: {
      workflows,
      currentId,
      nodes,
      edges,
      name,
      description,
      validationReport,
      selectedNode,
      editingNode,
      editingNodeId,
      runStatus: run.runStatus,
      runStdout: run.runStdout,
      runStderr: run.runStderr,
      runExitCode: run.runExitCode,
      runResult: run.runResult,
      lastSavedAt
    },
    handlers: {
      ...actions,
      setName: ui.setName,
      setDescription: ui.setDescription,
      setCurrentId,
      setNodes,
      onNodesChange,
      onEdgesChange,
      setEditingNodeId: ui.setEditingNodeId,
      onNodeClick,
      onNodeDoubleClick,
      createNewWorkflow: () => persist(emptyWorkflow()),
      createWorkflow1: () => persist(seedWorkflow1()),
      exportJson: () => {
        const data = getCurrentWorkflowData();
        persist(data);
        exportJson(data);
      },
      exportJava: () => {
        const data = getCurrentWorkflowData();
        persist(data);
        exportJava(data);
      },
      importWorkflow: (raw: unknown) => {
      const wf = deserializeWorkflow(raw as PortableWorkflow, undefined);
      persist(wf);
      },
    }
  };
}