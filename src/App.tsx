import ReactFlow, { Background, BackgroundVariant, Controls, MiniMap, MarkerType } from "reactflow"
import "reactflow/dist/style.css";

import { nodeTypes } from "./views/components/nodes/nodeTypes";
import { useWorkflowViewModel } from "./viewmodels/useWorkflowViewModel";
import { Sidebar } from "./views/components/Sidebar";
import { NodeConfigPanel } from "./views/components/NodeConfigPanel";

import styles from "./App.module.css";

export default function App() {
  const { state, handlers, fileInputRef } = useWorkflowViewModel();

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
            <button className={styles.btn} onClick={handlers.saveCurrent}>Guardar</button>
            <button className={styles.btn} onClick={handlers.exportJson}>Export JSON</button>
            <button className={styles.btn} onClick={handlers.exportJava}>Export .java</button>
            <button className={styles.btn} onClick={handlers.openImport}>Import JSON</button>
            <button className={`${styles.btn} ${styles.danger}`} onClick={handlers.deleteCurrent}>
              Eliminar
            </button>
            <button 
              className={styles.btn} 
              style={{ backgroundColor: "#27ae60", color: "white", marginLeft: "10px" }}
              onClick={async () => {
                console.log("Intentando ejecutar motor Java...");
                try {
                  // Usamos un nombre fijo para probar sin que el navegador se bloquee
                  const testName = "Carpeta_Nueva_Prueba"; 
                  
                  // Verificamos si la API existe antes de llamar
                  if (window.electronAPI && window.electronAPI.runJavaTest) {
                    await window.electronAPI.runJavaTest(testName);
                  } else {
                    console.error("La API de Electron no está disponible. Revisa el preload.");
                  }
                } catch (err) {
                  console.error("Error en el flujo:", err);
                }
              }}
            >
              📁 Crear Carpeta Pro
            </button>
            <input 
              ref={fileInputRef}
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
            <MiniMap pannable zoomable />
            <Controls />
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
        </footer>
      </div>

      <NodeConfigPanel 
        selectedNode={state.selectedNode} 
        updateSelectedNode={handlers.updateSelectedNode} 
      />
    </div>
  );
}