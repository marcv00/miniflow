import styles from "./NodeConfigPanel.module.css";

export function NodeConfigPanel({ selectedNode, updateSelectedNode }: any) {
  const t = selectedNode?.type;

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

          {t === "http_request" && (
            <>
              <div className={styles.field}>
                <label>Método</label>
                <select
                  value={selectedNode.data?.config?.method || "GET"}
                  onChange={(e) =>
                    updateSelectedNode({
                      config: { ...selectedNode.data.config, method: e.target.value },
                    })
                  }
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              <div className={styles.field}>
                <label>URL</label>
                <input
                  value={selectedNode.data?.config?.url || ""}
                  onChange={(e) =>
                    updateSelectedNode({
                      config: { ...selectedNode.data.config, url: e.target.value },
                    })
                  }
                />
              </div>

              <div className={styles.field}>
                <label>Timeout (ms)</label>
                <input
                  type="number"
                  value={selectedNode.data?.config?.timeoutMs ?? 5000}
                  onChange={(e) =>
                    updateSelectedNode({
                      config: { ...selectedNode.data.config, timeoutMs: Number(e.target.value) },
                    })
                  }
                />
              </div>

              <div className={styles.field}>
                <label>Reintentos</label>
                <input
                  type="number"
                  value={selectedNode.data?.config?.retries ?? 0}
                  onChange={(e) =>
                    updateSelectedNode({
                      config: { ...selectedNode.data.config, retries: Number(e.target.value) },
                    })
                  }
                />
              </div>

              <div className={styles.field}>
                <label>Política de error</label>
                <select
                  value={selectedNode.data?.config?.errorPolicy || "STOP_ON_FAIL"}
                  onChange={(e) =>
                    updateSelectedNode({
                      config: { ...selectedNode.data.config, errorPolicy: e.target.value },
                    })
                  }
                >
                  <option value="STOP_ON_FAIL">STOP_ON_FAIL</option>
                  <option value="CONTINUE_ON_FAIL">CONTINUE_ON_FAIL</option>
                </select>
              </div>

              <div className={styles.field}>
                <label>Mapeo status (JSONPath)</label>
                <input
                  value={selectedNode.data?.config?.map?.status || ""}
                  onChange={(e) =>
                    updateSelectedNode({
                      config: {
                        ...selectedNode.data.config,
                        map: { ...(selectedNode.data.config?.map || {}), status: e.target.value },
                      },
                    })
                  }
                />
              </div>

              <div className={styles.field}>
                <label>Mapeo payload (JSONPath)</label>
                <input
                  value={selectedNode.data?.config?.map?.payload || ""}
                  onChange={(e) =>
                    updateSelectedNode({
                      config: {
                        ...selectedNode.data.config,
                        map: { ...(selectedNode.data.config?.map || {}), payload: e.target.value },
                      },
                    })
                  }
                />
              </div>
            </>
          )}

          {t === "conditional" && (
            <div className={styles.field}>
              <label>Condición</label>
              <input
                value={selectedNode.data?.config?.condition || ""}
                onChange={(e) =>
                  updateSelectedNode({
                    config: { ...selectedNode.data.config, condition: e.target.value },
                  })
                }
              />
            </div>
          )}

          {t === "command" && (
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

              <div className={styles.field}>
                <label>Output key (opcional)</label>
                <input
                  value={selectedNode.data?.config?.outputKey || ""}
                  onChange={(e) =>
                    updateSelectedNode({
                      config: { ...selectedNode.data.config, outputKey: e.target.value },
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
