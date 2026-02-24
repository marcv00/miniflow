import type { NodeConfig } from "../../models/workflow/types";

export type NodePatch = {
  label?: string;
  config?: Partial<NodeConfig>;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function mergeConfig(prev: NodeConfig | undefined, patch: Partial<NodeConfig>): NodeConfig {
  if (!isPlainObject(prev)) return patch as NodeConfig;
  return {
    ...(prev as Record<string, unknown>),
    ...(patch as Record<string, unknown>)
  } as NodeConfig;
}