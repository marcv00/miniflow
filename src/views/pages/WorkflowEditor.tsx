import { useCallback, useRef, useMemo } from "react";
import ReactFlow, { Background, BackgroundVariant, MarkerType, ReactFlowProvider, useReactFlow } from "reactflow";
import { Link, useParams } from "react-router-dom";
import "reactflow/dist/style.css";

import { nodeTypes } from "../components/nodes/nodeTypes";
import { useWorkflowViewModel } from "../../viewmodels/useWorkflowViewModel";
import { Sidebar } from "../components/Sidebar";
import { NodeConfigModal } from "../components/NodeConfigModal";
import { NodeActionsProvider } from "../components/NodeActionsContext";
import type { NodeType } from "../../models/workflow/types";

import styles from "./WorkflowEditor.module.css";

function EditorInner() {
    const { id } = useParams<{ id: string }>();
    const { state, handlers, refs } = useWorkflowViewModel(id);
    const reactFlowInstance = useReactFlow();
    const wrapperRef = useRef<HTMLDivElement>(null);

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
                    <div className={styles.metaTitle}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <Link to="/workflows" style={{ color: "#78b4ff", fontWeight: 900, textDecoration: "none", fontSize: "15px" }}>MINIFLOW</Link>
                            <span style={{ opacity: 0.2 }}>/</span>
                            <strong>{state.name}</strong>
                        </div>
                        <div className={styles.small}>{state.description || "—"}</div>
                    </div>

                    <div className={styles.actions}>
                        <button className={styles.btn} onClick={handlers.exportJson}>Exportar JSON</button>
                        <button className={styles.btn} onClick={handlers.exportJava}>Exportar .java</button>
                        <button className={styles.btn} onClick={handlers.openImport}>Importar JSON</button>
                        <button className={`${styles.btn} ${styles.danger}`} onClick={handlers.deleteCurrent}>
                            Eliminar
                        </button>
                        <input
                            ref={refs.fileInputRef}
                            type="file"
                            accept="application/json"
                            style={{ display: "none" }}
                            onChange={handlers.onImportFile}
                        />
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

                <footer className={styles.errors}>
                    {!state.hasValidated ? (
                        <div className={styles.neutralItem}>Aún no validado</div>
                    ) : state.errors.length === 0 ? (
                        <div className={styles.okItem}>✅ Sin errores</div>
                    ) : (
                        state.errors.map((e: string, i: number) => (
                            <div key={i} className={styles.errItem}>{e}</div>
                        ))
                    )}

                    <div style={{ height: 8 }} />
                    {state.runStatus === "idle" ? (
                        <div className={styles.neutralItem}>Runner: listo</div>
                    ) : state.runStatus === "running" ? (
                        <div className={styles.neutralItem}>⏳ Ejecutando...</div>
                    ) : state.runStatus === "success" ? (
                        <div className={styles.okItem}>🏁 Ejecución terminada (exit {state.runExitCode ?? 0})</div>
                    ) : (
                        <div className={styles.errItem}>❌ Ejecución fallida (exit {state.runExitCode ?? "?"})</div>
                    )}

                    {(state.runStdout || state.runStderr) && (
                        <pre className={styles.runOutput}>{(state.runStdout ? state.runStdout : "") + (state.runStderr ? "\n" + state.runStderr : "")}</pre>
                    )}
                </footer>
            </div>

            {/* ── Node Config Modal ── */}
            {state.editingNode && (
                <NodeConfigModal
                    node={state.editingNode}
                    onSave={handlers.updateNodeById}
                    onClose={() => handlers.setEditingNodeId(null)}
                />
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
