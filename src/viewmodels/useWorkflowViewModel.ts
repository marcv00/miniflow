import { useEffect, useMemo, useState } from "react";
import { addEdge, useNodesState, useEdgesState, type Connection } from "reactflow";
import { makeNode, emptyWorkflow, seedWorkflow1 } from "../models/workflow/WorkflowFactory";
import { validate } from "../models/workflow/WorkflowValidator";
import { useWorkflowStorage } from "./useWorkflowStorage";
import { useWorkflowIO } from "./useWorkflowIO";
import type { FlowNode, Workflow, NodeType } from "../models/workflow/types";

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
    setRunStatus("idle");
    setRunStdout("");
    setRunStderr("");
    setRunExitCode(null);
  }, [current, setNodes, setEdges]);

  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);

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
    addNode: (type: NodeType) => {
      const bump = (nodes?.length || 0) * 30;
      setNodes(nds => nds.concat(makeNode(type, { x: 260 + bump, y: 220 + bump })));
    },
    onConnect: (params: Connection) =>
      setEdges(eds => {
        const label =
          params.sourceHandle === "true"
            ? "TRUE"
            : params.sourceHandle === "false"
              ? "FALSE"
              : undefined;

        const next: any = {
          ...params,
          id: crypto.randomUUID(),
          type: "smoothstep",
          label
        };

        return addEdge(next, eds);
      }),
    updateSelectedNode: (patch: { label?: string; config?: any }) => {
      setNodes(nds => nds.map(n => {
        if (n.id !== selectedNodeId) return n;

        const nextLabel = patch.label !== undefined ? patch.label : n.data.label;

        const nextConfig =
          patch.config !== undefined
            ? { ...(n.data as any).config, ...patch.config }
            : (n.data as any).config;

        return { ...n, data: { ...n.data, label: nextLabel, config: nextConfig } };
      }));
    }
  };

  return {
    state: { workflows, currentId, nodes, edges, name, description, errors, hasValidated, selectedNode, runStatus, runStdout, runStderr, runExitCode },
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
        createWorkflow1: () => persist(seedWorkflow1()),        exportJson: () => {
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
