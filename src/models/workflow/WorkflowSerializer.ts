/**
 * WorkflowSerializer
 * 
 * Converts between the internal ReactFlow representation (with position, width,
 * height, dragging, selected…) and the clean portable JSON format used by:
 *   - Backend execution (java-engine stdin)
 *   - Export (.json download)
 *   - Import (paste/upload)
 */
import type { Workflow, FlowNode, FlowEdge, NodeType } from "./types"
import { uid } from "./WorkflowFactory"

/* ─────────────── Portable types ─────────────── */

export interface PortableNode {
    id: string
    type: string            // UPPERCASE: START, HTTP_REQUEST, COMMAND, CONDITIONAL, END
    label: string
    config: Record<string, unknown>
    position?: { x: number; y: number }  // optional — preserved for import round-trips
}

export interface PortableEdge {
    source: string
    target: string
    sourceHandle?: string | null
    label?: string
}

export interface PortableWorkflow {
    nodes: PortableNode[]
    edges: PortableEdge[]
}

/* ─────────────── Serialize (ReactFlow → Portable) ─────────────── */

export function serializeWorkflow(wf: Workflow): PortableWorkflow {
    return {
        nodes: wf.nodes.map(serializeNode),
        edges: wf.edges.map(serializeEdge)
    }
}

function serializeNode(node: FlowNode): PortableNode {
    return {
        id: node.id,
        type: (node.type || "start").toUpperCase(),
        label: node.data?.label || "",
        config: node.data?.config ? cleanConfig(node.data.config as Record<string, unknown>) : {},
        position: node.position
    }
}

function cleanConfig(config: Record<string, unknown>): Record<string, unknown> {
    const cleaned: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(config)) {
        // Skip empty strings and undefined — keep nulls, 0, false, and real values
        if (value === undefined) continue
        if (typeof value === "string" && value.trim() === "") continue
        cleaned[key] = value
    }
    return cleaned
}

function serializeEdge(edge: FlowEdge): PortableEdge {
    const pe: PortableEdge = {
        source: edge.source,
        target: edge.target
    }
    if (edge.sourceHandle) pe.sourceHandle = edge.sourceHandle
    if (edge.label) pe.label = String(edge.label)
    return pe
}

/* ─────────────── Deserialize (Portable → ReactFlow) ─────────────── */

const TYPE_MAP: Record<string, NodeType> = {
    START: "start",
    END: "end",
    HTTP_REQUEST: "http_request",
    COMMAND: "command",
    CONDITIONAL: "conditional"
}

const DEFAULT_POSITIONS: Record<string, { x: number; y: number }> = {
    start: { x: 80, y: 220 },
    end: { x: 1000, y: 220 },
    http_request: { x: 360, y: 220 },
    command: { x: 650, y: 220 },
    conditional: { x: 650, y: 220 }
}

export function deserializeWorkflow(raw: PortableWorkflow, id?: string): Workflow {
    let offsetY = 0

    const nodes: FlowNode[] = (raw.nodes || []).map((pn, i) => {
        const lowerType = TYPE_MAP[pn.type?.toUpperCase()] || "command"
        const fallback = DEFAULT_POSITIONS[lowerType] || { x: 400, y: 220 }
        const position = pn.position || { x: fallback.x + i * 30, y: fallback.y + offsetY }
        if (!pn.position) offsetY += 30

        return {
            id: pn.id || uid(),
            type: lowerType,
            position,
            data: {
                label: pn.label || pn.type || "Nodo",
                config: (pn.config || {}) as any
            }
        } as FlowNode
    })

    const edges: FlowEdge[] = (raw.edges || []).map(pe => ({
        id: uid(),
        source: pe.source,
        target: pe.target,
        type: "smoothstep",
        ...(pe.sourceHandle ? { sourceHandle: pe.sourceHandle } : {}),
        ...(pe.label ? { label: pe.label } : {})
    }))

    return {
        id: id || uid(),
        name: (raw as any).name || "WORKFLOW",
        description: (raw as any).description || "",
        nodes,
        edges
    }
}
