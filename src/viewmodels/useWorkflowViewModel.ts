import { useEffect, useMemo, useState, useCallback } from "react";
import { addEdge, useNodesState, useEdgesState, MarkerType, type Connection } from "reactflow";
import { makeNode, emptyWorkflow, seedWorkflow1 } from "../models/workflow/WorkflowFactory";
import { validate } from "../models/workflow/WorkflowValidator";
import { useWorkflowStorage } from "./useWorkflowStorage";
import { useWorkflowIO } from "./useWorkflowIO";
import type { FlowNode, Workflow, NodeType } from "../models/workflow/types";

export function useWorkflowViewModel(initialId?: string) {
  const { workflows, currentId, setCurrentId, persist, remove } = useWorkflowStorage();

  useEffect(() => {
    if (initialId && initialId !== currentId) {
      setCurrentId(initialId);
    }
  }, [initialId]);

  const current = useMemo(() => workflows.find(w => w.id === currentId) ?? null, [workflows, currentId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(current?.nodes ?? []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(current?.edges ?? []);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [name, setName] = useState(current?.name ?? "WORKFLOW");
  const [description, setDescription] = useState(current?.description ?? "");
  const [errors, setErrors] = useState<string[]>([]);
  const [hasValidated, setHasValidated] = useState(false);
  const [runStatus, setRunStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [runStdout, setRunStdout] = useState("");
  const [runStderr, setRunStderr] = useState("");
  const [runExitCode, setRunExitCode] = useState<number | null>(null);

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
    setEditingNodeId(null);
    setRunStatus("idle");
    setRunStdout("");
    setRunStderr("");
    setRunExitCode(null);
  }, [current, setNodes, setEdges]);

  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);
  const editingNode = useMemo(() => nodes.find(n => n.id === editingNodeId) || null, [nodes, editingNodeId]);

  const getCurrentWorkflowData = (): Workflow => ({
    id: currentId ?? crypto.randomUUID(),
    name: name.trim() || "WORKFLOW",
    description,
    nodes: nodes as FlowNode[],
    edges
  });

  const updateNodeById = useCallback((nodeId: string, patch: { label?: string; config?: any }) => {
    setNodes(nds => nds.map(n => {
      if (n.id !== nodeId) return n;
      const nextLabel = patch.label !== undefined ? patch.label : n.data.label;
      const nextConfig = patch.config !== undefined
        ? { ...(n.data as any).config, ...patch.config }
        : (n.data as any).config;
      return { ...n, data: { ...n.data, label: nextLabel, config: nextConfig } };
    }));
  }, [setNodes]);

  const duplicateNode = useCallback((nodeId: string) => {
    const source = nodes.find(n => n.id === nodeId);
    if (!source) return;
    // Block duplicating START
    if (source.type === "start" && nodes.some(n => n.type === "start")) return;
    const newNode = makeNode(source.type as NodeType, {
      x: source.position.x + 50,
      y: source.position.y + 50
    });
    newNode.data = JSON.parse(JSON.stringify(source.data));
    setNodes(nds => nds.concat(newNode));
  }, [nodes, setNodes]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes(nds => nds.filter(n => n.id !== nodeId));
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    if (editingNodeId === nodeId) setEditingNodeId(null);
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  }, [setNodes, setEdges, editingNodeId, selectedNodeId]);

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
    executeNow: async () => {
      const data = getCurrentWorkflowData();
      persist(data);

      const errs = validate(nodes as FlowNode[], edges);
      setErrors(errs);
      setHasValidated(true);

      if (errs.length) {
        const msg = ["No se puede ejecutar: el workflow es inválido.", "", ...errs.slice(0, 6)].join("\n");
        alert(msg);
        return;
      }

      setRunStatus("running");
      setRunStdout("");
      setRunStderr("");
      setRunExitCode(null);

      try {
        const res = await window.electronAPI.runWorkflow(JSON.stringify(data));
        setRunExitCode(res.exitCode ?? null);
        setRunStdout(res.stdout || "");
        setRunStderr(res.stderr || "");
        setRunStatus(res.ok ? "success" : "error");
      } catch (e: any) {
        setRunStderr(String(e?.message || e || "Error"));
        setRunStatus("error");
      }
    },
    addNode: (type: NodeType, position?: { x: number; y: number }) => {
      // START unique guard
      if (type === "start" && nodes.some(n => n.type === "start")) return;
      const bump = (nodes?.length || 0) * 30;
      const pos = position ?? { x: 260 + bump, y: 220 + bump };
      setNodes(nds => nds.concat(makeNode(type, pos)));
    },
    onConnect: (params: Connection) =>
      setEdges(eds => {
        const isTrue = params.sourceHandle === "true";
        const isFalse = params.sourceHandle === "false";
        const label = isTrue ? "TRUE" : isFalse ? "FALSE" : undefined;
        const edgeColor = isTrue ? "#28b478" : isFalse ? "#d23750" : undefined;

        const next: any = {
          ...params,
          id: crypto.randomUUID(),
          type: "smoothstep",
          label,
          ...(edgeColor && {
            style: { stroke: edgeColor, strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor, width: 15, height: 12 },
            labelStyle: { fill: edgeColor, fontWeight: 700, fontSize: 11 },
            labelBgStyle: { fill: "rgba(14, 20, 36, 0.85)", stroke: edgeColor, strokeWidth: 1 },
            labelBgPadding: [6, 4] as [number, number],
            labelBgBorderRadius: 6
          })
        };

        return addEdge(next, eds);
      }),
    updateSelectedNode: (patch: { label?: string; config?: any }) => {
      if (selectedNodeId) updateNodeById(selectedNodeId, patch);
    },
    updateNodeById,
    duplicateNode,
    deleteNode
  };

  return {
    state: { workflows, currentId, nodes, edges, name, description, errors, hasValidated, selectedNode, editingNode, editingNodeId, runStatus, runStdout, runStderr, runExitCode },
    refs: { fileInputRef },
    handlers: {
      ...actions,
      setName,
      setDescription,
      setCurrentId,
      setNodes,
      onNodesChange,
      onEdgesChange,
      setEditingNodeId,
      onNodeClick: (_: any, node: any) => setSelectedNodeId(node.id),
      onNodeDoubleClick: (_: any, node: any) => setEditingNodeId(node.id),
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
      onImportFile,
      openImport
    }
  };
}
