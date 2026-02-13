import ReactFlow, { Background, BackgroundVariant, MarkerType } from "reactflow";
import { Link, useParams } from "react-router-dom";
import "reactflow/dist/style.css";

import { nodeTypes } from "../components/nodes/nodeTypes";
import { useWorkflowViewModel } from "../../viewmodels/useWorkflowViewModel";
import { Sidebar } from "../components/Sidebar";
import { NodeConfigPanel } from "../components/NodeConfigPanel";

import styles from "./WorkflowEditor.module.css";

export default function WorkflowEditor() {
    const { id } = useParams<{ id: string }>();
    const { state, handlers, refs } = useWorkflowViewModel(id);

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

                <main className={styles.canvasWrap}>
                    <ReactFlow
                        nodes={state.nodes}
                        edges={state.edges}
                        nodeTypes={nodeTypes}
                        onNodesChange={handlers.onNodesChange}
                        onEdgesChange={handlers.onEdgesChange}
                        onConnect={handlers.onConnect}
                        onNodeClick={handlers.onNodeClick}
                        fitView
                        defaultEdgeOptions={{ markerEnd: { type: MarkerType.ArrowClosed } }}
                    >
                        <Background variant={BackgroundVariant.Dots} gap={18} size={1} />
                    </ReactFlow>
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

            <NodeConfigPanel
                selectedNode={state.selectedNode}
                updateSelectedNode={handlers.updateSelectedNode}
            />
        </div>
    );
}
