import type { Workflow } from "../../models/workflow/types";

export type EnginePayload = {
  name: string;
  nodes: Array<{
    id: string;
    type: string;
    data: { label: string; config: unknown };
    position: { x: number; y: number };
  }>;
  edges: Array<{
    source: string;
    target: string;
    sourceHandle?: string;
    label?: string;
  }>;
};

export function buildEnginePayload(data: Workflow): EnginePayload {
  return {
    name: data.name,
    nodes: data.nodes.map((n) => ({
      id: n.id,
      type: String(n.type ?? "start").toUpperCase(),
      data: { label: n.data?.label ?? "", config: n.data?.config ?? {} },
      position: n.position
    })),
    edges: data.edges.map((e) => ({
      source: e.source,
      target: e.target,
      ...(e.sourceHandle ? { sourceHandle: e.sourceHandle } : {}),
      ...(e.label ? { label: String(e.label) } : {})
    }))
  };
}