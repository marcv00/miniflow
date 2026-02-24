import styles from "./NodeConfigPanel.module.css";
import type { NodePatch } from "../../viewmodels/helpers/nodePatch";
import type { FlowNode, HttpRequestConfig, CommandConfig, ConditionalConfig } from "../../models/workflow/types";

interface Props {
  selectedNode: FlowNode | null;
  updateSelectedNode: (patch: NodePatch) => void;
}

export function NodeConfigPanel({ selectedNode, updateSelectedNode }: Props) {
  const t = selectedNode?.type;
  const cfg = selectedNode?.data?.config;
  const httpCfg = cfg as HttpRequestConfig | undefined;
  const cmdCfg = cfg as CommandConfig | undefined;
  const condCfg = cfg as ConditionalConfig | undefined;

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
                  value={httpCfg?.method || "GET"}
                  onChange={(e) =>
                    updateSelectedNode({
                      config: { ...cfg, method: e.target.value },
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
                  value={httpCfg?.url || ""}
                  onChange={(e) =>
                    updateSelectedNode({
                      config: { ...cfg, url: e.target.value },
                    })
                  }
                />
              </div>

              <div className={styles.field}>
                <label>Timeout (ms)</label>
                <input
                  type="number"
                  value={httpCfg?.timeoutMs ?? 5000}
                  onChange={(e) =>
                    updateSelectedNode({
                      config: { ...cfg, timeoutMs: Number(e.target.value) },
                    })
                  }
                />
              </div>

              <div className={styles.field}>
                <label>Reintentos</label>
                <input
                  type="number"
                  value={httpCfg?.retries ?? 0}
                  onChange={(e) =>
                    updateSelectedNode({
                      config: { ...cfg, retries: Number(e.target.value) },
                    })
                  }
                />
              </div>

              <div className={styles.field}>
                <label>Política de error</label>
                <select
                  value={httpCfg?.errorPolicy || "STOP_ON_FAIL"}
                  onChange={(e) =>
                    updateSelectedNode({
                      config: { ...cfg, errorPolicy: e.target.value as "STOP_ON_FAIL" | "CONTINUE_ON_FAIL" },
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
                  value={httpCfg?.map?.status || ""}
                  onChange={(e) =>
                    updateSelectedNode({
                      config: {
                        ...cfg,
                        map: { ...(httpCfg?.map || {}), status: e.target.value },
                      },
                    })
                  }
                />
              </div>

              <div className={styles.field}>
                <label>Mapeo payload (JSONPath)</label>
                <input
                  value={httpCfg?.map?.payload || ""}
                  onChange={(e) =>
                    updateSelectedNode({
                      config: {
                        ...cfg,
                        map: { ...(httpCfg?.map || {}), payload: e.target.value },
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
                value={condCfg?.condition || ""}
                onChange={(e) =>
                  updateSelectedNode({
                    config: { ...cfg, condition: e.target.value },
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
                  value={cmdCfg?.command || ""}
                  onChange={(e) =>
                    updateSelectedNode({
                      config: { ...cfg, command: e.target.value },
                    })
                  }
                />
              </div>

              <div className={styles.field}>
                <label>
                  {String(cmdCfg?.command || "").trim().toLowerCase().startsWith("python")
                    ? "Ruta script local (obligatoria para python)"
                    : "Ruta script local (opcional)"}
                </label>
                <input
                  placeholder="C:\\Users\\Harry\\Desktop\\process.py"
                  value={cmdCfg?.scriptPath || ""}
                  onChange={(e) =>
                    updateSelectedNode({
                      config: { ...cfg, scriptPath: e.target.value },
                    })
                  }
                />
              </div>

              <div className={styles.field}>
                <label>Argumentos</label>
                <input
                  value={cmdCfg?.args || ""}
                  onChange={(e) =>
                    updateSelectedNode({
                      config: { ...cfg, args: e.target.value },
                    })
                  }
                />
              </div>

              <div className={styles.field}>
                <label>Output key (opcional)</label>
                <input
                  value={cmdCfg?.outputKey || ""}
                  onChange={(e) =>
                    updateSelectedNode({
                      config: { ...cfg, outputKey: e.target.value },
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
