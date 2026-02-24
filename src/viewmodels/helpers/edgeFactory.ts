import { addEdge, MarkerType, type Connection, type Edge } from "reactflow";

const EDGE_COLOR_TRUE = "#28b478";
const EDGE_COLOR_FALSE = "#d23750";
export function addStyledEdge(params: Connection, eds: Edge[]): Edge[] {
  if (!params.source || !params.target) return eds;

  const isTrue = params.sourceHandle === "true";
  const isFalse = params.sourceHandle === "false";

  const label = isTrue ? "TRUE" : isFalse ? "FALSE" : undefined;
    const edgeColor = isTrue ? EDGE_COLOR_TRUE : isFalse ? EDGE_COLOR_FALSE : undefined;

  const next: Edge = {
    id: crypto.randomUUID(),
    source: params.source,
    target: params.target,
    type: "smoothstep",
    ...(params.sourceHandle ? { sourceHandle: params.sourceHandle } : {}),
    ...(params.targetHandle ? { targetHandle: params.targetHandle } : {}),
    ...(label ? { label } : {}),
    ...(edgeColor
      ? {
          style: { stroke: edgeColor, strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: edgeColor,
            width: 15,
            height: 12,
          },
          labelStyle: { fill: edgeColor, fontWeight: 700, fontSize: 11 },
          labelBgStyle: { fill: "rgba(14, 20, 36, 0.85)", stroke: edgeColor, strokeWidth: 1 },
          labelBgPadding: [6, 4],
          labelBgBorderRadius: 6,
        }
      : {}),
  };

  return addEdge(next, eds);
}