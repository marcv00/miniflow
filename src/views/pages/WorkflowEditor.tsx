import { useCallback, useEffect, useRef, useMemo, useState } from "react";
import ReactFlow, { Background, BackgroundVariant, MarkerType, ReactFlowProvider, useReactFlow } from "reactflow";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    Save, CheckCircle, Play,
    Download, Trash2, Clipboard, AlertTriangle
} from "lucide-react";
import "reactflow/dist/style.css";

import { nodeTypes } from "../components/nodes/nodeTypes";
import { useWorkflowViewModel } from "../../viewmodels/useWorkflowViewModel";
import { serializeWorkflow } from "../../models/workflow/WorkflowSerializer";
import { Sidebar } from "../components/Sidebar";
import { NodeConfigModal } from "../components/NodeConfigModal";
import { NodeActionsProvider } from "../components/NodeActionsContext";
import ValidationPanel from "../components/ValidationPanel";
import type { NodeType } from "../../models/workflow/types";

import styles from "./WorkflowEditor.module.css";

function formatTimeAgo(date: Date | null): string {
    if (!date) return "Sin guardar";
    const d = date.getDate();
    const m = date.getMonth() + 1;
    const y = date.getFullYear();
    let h = date.getHours();
    const min = date.getMinutes().toString().padStart(2, "0");
    const ampm = h >= 12 ? "pm" : "am";
    h = h % 12 || 12;
    return `Última vez guardado el ${d}/${m}/${y} ${h}:${min}${ampm}`;
}

function EditorInner() {
    const { id } = useParams<{ id: string }>();
    const { state, handlers } = useWorkflowViewModel(id);
    const reactFlowInstance = useReactFlow();
    const wrapperRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const [toast, setToast] = useState<string | null>(null);
    const [importOpen, setImportOpen] = useState(false);
    const [importJson, setImportJson] = useState("");
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [statusExpanded, setStatusExpanded] = useState(false);

    // Auto-hide status pill after 8s on success
    useEffect(() => {
        if (state.runStatus === "success") {
            const timer = setTimeout(() => {
                // Reset to idle after 8s on success
            }, 8000);
            return () => clearTimeout(timer);
        }
        if (state.runStatus === "running") {
            setStatusExpanded(false);
        }
    }, [state.runStatus]);

    const showToast = useCallback((msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 2500);
    }, []);

    const copyToClipboard = useCallback(() => {
        handlers.saveCurrent();
        const data = { id: state.currentId, name: state.name, description: state.description, nodes: state.nodes, edges: state.edges };
        const portable = serializeWorkflow(data as any);
        navigator.clipboard.writeText(JSON.stringify(portable, null, 2));
        showToast("El workflow ha sido copiado al portapapeles");
    }, [handlers, state, showToast]);

    /* ── Drag & Drop ── */
    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
    }, []);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const type = e.dataTransfer.getData("application/miniflow-node") as NodeType;
        if (!type) return;
        const position = reactFlowInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });
        handlers.addNode(type, position);
    }, [reactFlowInstance, handlers]);

    /* ── Node Actions for Context ── */
    const nodeActions = useMemo(() => ({
        onEdit: (nodeId: string) => handlers.setEditingNodeId(nodeId),
        onDuplicate: (nodeId: string) => handlers.duplicateNode(nodeId),
        onDelete: (nodeId: string) => handlers.deleteNode(nodeId)
    }), [handlers]);

    return (
        <div className={styles.app}>
            <Sidebar state={state} handlers={handlers} />

            <div className={styles.main}>
                <header className={styles.topbar}>
                    {/* ── Left: Breadcrumb + Description ── */}
                    <div className={styles.metaTitle}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <Link to="/workflows" style={{ color: "#78b4ff", fontWeight: 900, textDecoration: "none", fontSize: "15px" }}>MINIFLOW</Link>
                            <span style={{ opacity: 0.2 }}>/</span>
                            <strong>{state.name}</strong>
                        </div>
                        <div className={styles.descriptionText}>{state.description || "—"}</div>
                    </div>

                    {/* ── Center: Timestamp ── */}
                    <div className={styles.timestamp}>{formatTimeAgo(state.lastSavedAt)}</div>

                    {/* ── Primary Actions ── */}
                    <div className={styles.primaryActions}>
                        <button className={styles.tbBtn} onClick={handlers.saveCurrent} title="Guardar">
                            <Save size={15} /> Guardar
                        </button>
                        <button className={`${styles.tbBtn} ${styles.tbValidate}`} onClick={handlers.validateNow} title="Validar">
                            <CheckCircle size={15} /> Validar
                        </button>
                        <button className={`${styles.tbBtn} ${styles.tbExecute}`} onClick={handlers.executeNow} title="Ejecutar">
                            <Play size={15} /> Ejecutar
                        </button>
                    </div>

                    {/* ── Separator ── */}
                    <div className={styles.tbSep} />

                    {/* ── Right: Secondary Actions ── */}
                    <div className={styles.secondaryActions}>
                        <button className={`${styles.tbBtn} ${styles.tbSubtle}`} onClick={() => { setImportJson(""); setImportOpen(true); }} title="Importar JSON">
                            <Download size={14} /> Importar
                        </button>
                        <button className={`${styles.tbBtn} ${styles.tbSubtle}`} onClick={copyToClipboard} title="Copiar JSON al portapapeles">
                            <Clipboard size={14} /> Exportar
                        </button>
                        <button className={`${styles.tbBtn} ${styles.tbDanger}`} onClick={() => setDeleteOpen(true)} title="Eliminar workflow">
                            <Trash2 size={14} />
                        </button>
                    </div>
                </header>

                <main className={styles.canvasWrap} ref={wrapperRef}>
                    <NodeActionsProvider value={nodeActions}>
                        <ReactFlow
                            nodes={state.nodes}
                            edges={state.edges}
                            nodeTypes={nodeTypes}
                            onNodesChange={handlers.onNodesChange}
                            onEdgesChange={handlers.onEdgesChange}
                            onConnect={handlers.onConnect}
                            onNodeClick={handlers.onNodeClick}
                            onNodeDoubleClick={handlers.onNodeDoubleClick}
                            onDragOver={onDragOver}
                            onDrop={onDrop}
                            fitView
                            defaultEdgeOptions={{ markerEnd: { type: MarkerType.ArrowClosed } }}
                        >
                            <Background variant={BackgroundVariant.Dots} gap={18} size={1} />
                        </ReactFlow>
                    </NodeActionsProvider>
                </main>

                {/* ── Validation Panel ── */}
                {state.validationReport && (
                    <ValidationPanel
                        report={state.validationReport}
                        onClose={handlers.closeValidation}
                        onFocusNode={(nodeId) => {
                            const node = state.nodes.find(n => n.id === nodeId);
                            if (node) {
                                reactFlowInstance.setCenter(node.position.x + 75, node.position.y + 25, { zoom: 1.5, duration: 400 });
                            }
                        }}
                    />
                )}

                {/* ── Engine Status Pill (always visible) ── */}
                <div className={styles.statusPillWrap}>
                    <button
                        className={`${styles.statusPill} ${styles[`statusPill_${state.runStatus}`]}`}
                        onClick={() => {
                            if (state.runStatus === "idle") {
                                handlers.executeNow();
                            } else if (state.runStatus !== "running") {
                                setStatusExpanded(!statusExpanded);
                            }
                        }}
                        title={state.runStatus === "idle" ? "Click para ejecutar" : state.runStatus === "running" ? "Ejecutando…" : "Click para ver detalles"}
                    >
                        <span className={styles.statusDot} />
                        <span className={styles.statusLabel}>
                            {state.runStatus === "idle" && "Motor listo"}
                            {state.runStatus === "running" && "Ejecutando…"}
                            {state.runStatus === "success" && `✓ Ejecución exitosa`}
                            {state.runStatus === "error" && `✕ Error en ejecución`}
                        </span>
                        {state.runStatus === "running" && <span className={styles.statusSpinner} />}
                        {(state.runStatus === "success" || state.runStatus === "error") && (
                            <span className={styles.statusChevron}>{statusExpanded ? "▾" : "▸"}</span>
                        )}
                    </button>

                    {statusExpanded && state.runStatus !== "running" && state.runStatus !== "idle" && (
                        <div className={styles.statusDetail}>
                            {state.runResult?.steps?.length > 0 && (
                                <div className={styles.stepsList}>
                                    {state.runResult.steps.map((step: any, i: number) => (
                                        <div key={i} className={`${styles.stepItem} ${step.status === "ERROR" ? styles.stepError : styles.stepOk}`}>
                                            <span className={styles.stepIndex}>{i + 1}</span>
                                            <span className={styles.stepLabel}>{step.nodeLabel || step.nodeId}</span>
                                            <span className={styles.stepType}>{step.nodeType}</span>
                                            <span className={styles.stepStatus}>{step.status}</span>
                                            <span className={styles.stepDuration}>{step.durationMs}ms</span>
                                            {step.error && <div className={styles.stepErrorMsg}>{step.error}</div>}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {state.runStderr && (
                                <pre className={styles.runOutput}>{state.runStderr}</pre>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Node Config Modal ── */}
            {state.editingNode && (
                <NodeConfigModal
                    node={state.editingNode}
                    onSave={handlers.updateNodeById}
                    onClose={() => handlers.setEditingNodeId(null)}
                />
            )}

            {/* ── Toast ── */}
            {toast && (
                <div className={styles.toast}>
                    <CheckCircle size={16} />
                    {toast}
                </div>
            )}

            {/* ── Import Modal ── */}
            {importOpen && (
                <div className={styles.modalOverlay} onClick={() => setImportOpen(false)}>
                    <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
                        <h3 className={styles.modalTitle}>Importar Workflow (JSON)</h3>
                        <textarea
                            className={styles.modalTextarea}
                            placeholder='Pega aquí el JSON del workflow...'
                            value={importJson}
                            onChange={e => setImportJson(e.target.value)}
                            rows={14}
                        />
                        <div className={styles.modalActions}>
                            <button className={styles.modalCancel} onClick={() => setImportOpen(false)}>Cancelar</button>
                            <button
                                className={styles.modalConfirm}
                                onClick={() => {
                                    try {
                                        const obj = JSON.parse(importJson);
                                        if (!obj.nodes || !Array.isArray(obj.nodes)) {
                                            showToast("JSON inválido — debe tener un array 'nodes'");
                                            return;
                                        }
                                        handlers.importWorkflow(obj);
                                        setImportOpen(false);
                                        showToast("Workflow importado exitosamente");
                                    } catch {
                                        showToast("JSON inválido — revisa el formato");
                                    }
                                }}
                            >
                                Importar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation Modal ── */}
            {deleteOpen && (
                <div className={styles.modalOverlay} onClick={() => setDeleteOpen(false)}>
                    <div className={styles.modalBox} onClick={e => e.stopPropagation()} style={{ width: 420 }}>
                        <div className={styles.deleteModalHeader}>
                            <div className={styles.deleteIconWrap}>
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className={styles.modalTitle} style={{ margin: 0 }}>Eliminar Workflow</h3>
                        </div>
                        <p className={styles.deleteMsg}>
                            ¿Estás seguro de que deseas eliminar <strong>{state.name}</strong>? Esta acción no se puede deshacer.
                        </p>
                        <div className={styles.modalActions}>
                            <button className={styles.modalCancel} onClick={() => setDeleteOpen(false)}>Cancelar</button>
                            <button
                                className={styles.deleteConfirmBtn}
                                onClick={() => {
                                    handlers.deleteCurrent();
                                    navigate("/workflows");
                                }}
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function WorkflowEditor() {
    return (
        <ReactFlowProvider>
            <EditorInner />
        </ReactFlowProvider>
    );
}
