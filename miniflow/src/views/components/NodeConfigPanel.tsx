import styles from "./NodeConfigPanel.module.css";

export function NodeConfigPanel({ selectedNode, updateSelectedNode }: any) {
  return (
    <div className={styles.panel}>
      <div className={styles.sectionTitle}>Config de Nodo</div>

      {!selectedNode ? (
        <div className={styles.card}>
          <div className={styles.small}>
            Haz click en un nodo para editar su configuración.
          </div>
        </div>
      ) : (
        <div className={styles.card}>
          <div className={styles.badge}>
            <span style={{ fontWeight: 900 }}>
              {String(selectedNode.type).toUpperCase()}
            </span>
            <span className={styles.small}> {selectedNode.id.slice(0, 6)}</span>
          </div>

          <div className={styles.field} style={{ marginTop: 12 }}>
            <label>Etiqueta</label>
            <input
              value={selectedNode.data?.label || ""}
              onChange={(e) => updateSelectedNode({ label: e.target.value })}
            />
          </div>

          {selectedNode.type === "command" && (
            <>
              <div className={styles.field}>
                <label>Comando</label>
                <input
                  value={selectedNode.data?.config?.command || ""}
                  onChange={(e) =>
                    updateSelectedNode({
                      config: { ...selectedNode.data.config, command: e.target.value },
                    })
                  }
                />
              </div>
              <div className={styles.field}>
                <label>Argumentos</label>
                <input
                  value={selectedNode.data?.config?.args || ""}
                  onChange={(e) =>
                    updateSelectedNode({
                      config: { ...selectedNode.data.config, args: e.target.value },
                    })
                  }
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}