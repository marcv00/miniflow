import ReactFlow, { Background, MarkerType } from "reactflow";
import "reactflow/dist/style.css";

import { nodeTypes } from "./views/components/nodes/nodeTypes";
import { useWorkflowViewModel } from "./viewmodels/useWorkflowViewModel";
import { Sidebar } from "./views/components/Sidebar";
import { NodeConfigPanel } from "./views/components/NodeConfigPanel";

import styles from "./App.module.css";

export default function App() {
  const { state, handlers, refs } = useWorkflowViewModel();

  return (
    <div className={styles.app}>
      <Sidebar state={state} handlers={handlers} />

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.metaTitle}>
            <strong>{state.name}</strong>
            <div className={styles.small}>{state.description || "—"}</div>
          </div>

          <div className={styles.actions}>
            <button className={styles.btn} onClick={handlers.validateNow}>Validar</button>
            <button className={styles.btn} onClick={handlers.executeNow}>Ejecutar</button>
            <button className={styles.btn} onClick={handlers.saveCurrent}>Guardar</button>
            <button className={styles.btn} onClick={handlers.exportJson}>Export JSON</button>
            <button className={styles.btn} onClick={handlers.exportJava}>Export .java</button>
            <button className={styles.btn} onClick={handlers.openImport}>Import JSON</button>
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
          >            <Background variant="dots" gap={18} size={1} />
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
            <pre className={styles.runOutput}>{(state.runStdout ? "STDOUT:\n" + state.runStdout : "") + (state.runStderr ? "\nSTDERR:\n" + state.runStderr : "")}</pre>
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
