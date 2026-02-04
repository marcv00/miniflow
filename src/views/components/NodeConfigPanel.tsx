import styles from "./NodeConfigPanel.module.css"
import type { FlowNode, ConditionalConfig, CommandConfig, HttpRequestConfig, ConfigByType, NodeType, HttpMethod } from "../../models/workflow/types"

type Props = {
  selectedNode: FlowNode | null
  updateSelectedNode: (patch: { label?: string; config?: Partial<ConfigByType[NodeType]> }) => void
}


export function NodeConfigPanel({ selectedNode, updateSelectedNode }: Props) {
  if (!selectedNode) {
    return (
      <div className={styles.panel}>
        <div className={styles.sectionTitle}>Config de Nodo</div>
        <div className={styles.card}>
          <div className={styles.small}>Haz click en un nodo para editar su configuración.</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.panel}>
      <div className={styles.sectionTitle}>Config de Nodo</div>

      <div className={styles.card}>
        <div className={styles.badge}>
          <span style={{ fontWeight: 900 }}>{String(selectedNode.type).toUpperCase()}</span>
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
            {(() => {
              const cfg = selectedNode.data.config as CommandConfig
              return (
                <>
                  <div className={styles.field}>
                    <label>Comando</label>
                    <input
                      value={cfg.command || ""}
                      onChange={(e) => updateSelectedNode({ config: { ...cfg, command: e.target.value } })}
                    />
                  </div>

                  <div className={styles.field}>
                    <label>Argumentos</label>
                    <input
                      value={cfg.args || ""}
                      onChange={(e) => updateSelectedNode({ config: { ...cfg, args: e.target.value } })}
                    />
                  </div>

                  <div className={styles.field}>
                    <label>Output Key (opcional)</label>
                    <input
                      value={cfg.outputKey || ""}
                      onChange={(e) => updateSelectedNode({ config: { ...cfg, outputKey: e.target.value } })}
                    />
                  </div>
                </>
              )
            })()}
          </>
        )}
        {selectedNode.type === "http_request" && (
      <>
        {(() => {
          const cfg = selectedNode.data.config as HttpRequestConfig
          return (
            <>
              <div className={styles.field}>
                <label>Método</label>
                <select
                  value={cfg.method || "GET"}
                  onChange={(e) =>
                    updateSelectedNode({
                      config: { ...cfg, method: e.target.value as HttpMethod }
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
                  value={cfg.url || ""}
                  onChange={(e) => updateSelectedNode({ config: { ...cfg, url: e.target.value } })}
                  placeholder="https://api.ejemplo.com/data"
                />
              </div>
    
              <div className={styles.field}>
                <label>Headers (JSON)</label>
                <textarea
                  value={cfg.headersJson || "{}"}
                  onChange={(e) => updateSelectedNode({ config: { ...cfg, headersJson: e.target.value } })}
                  placeholder='{"Authorization":"Bearer ..."}'
                />
              </div>
    
              <div className={styles.field}>
                <label>Query Params (JSON)</label>
                <textarea
                  value={cfg.queryParamsJson || "{}"}
                  onChange={(e) => updateSelectedNode({ config: { ...cfg, queryParamsJson: e.target.value } })}
                  placeholder='{"page":1}'
                />
              </div>
    
              <div className={styles.field}>
                <label>Body (JSON)</label>
                <textarea
                  value={cfg.bodyJson || "{}"}
                  onChange={(e) => updateSelectedNode({ config: { ...cfg, bodyJson: e.target.value } })}
                  placeholder='{"foo":"bar"}'
                />
              </div>
    
              <div className={styles.field}>
                <label>Timeout (ms)</label>
                <input
                  type="number"
                  value={cfg.timeoutMs ?? 5000}
                  onChange={(e) => updateSelectedNode({ config: { ...cfg, timeoutMs: Number(e.target.value) } })}
                />
              </div>
    
              <div className={styles.field}>
                <label>Retries</label>
                <input
                  type="number"
                  value={cfg.retries ?? 0}
                  onChange={(e) => updateSelectedNode({ config: { ...cfg, retries: Number(e.target.value) } })}
                />
              </div>
    
              <div className={styles.field}>
                <label>Guardar en context key</label>
                <input
                  value={cfg.contextKey || "http"}
                  onChange={(e) => updateSelectedNode({ config: { ...cfg, contextKey: e.target.value } })}
                  placeholder="http"
                />
              </div>
    
              <div className={styles.small}>
                Tip: este nodo debería escribir la respuesta en <b>context.{cfg.contextKey || "http"}</b>.
              </div>
            </>
          )
        })()}
      </>
    )}


        {selectedNode.type === "conditional" && (
          <>
            {(() => {
              const cfg = selectedNode.data.config as ConditionalConfig
              return (
                <>
                  <div className={styles.field}>
                    <label>Left (path)</label>
                    <input
                      value={cfg.leftPath || ""}
                      onChange={(e) => updateSelectedNode({ config: { ...cfg, leftPath: e.target.value } })}
                      placeholder="context.http.status"
                    />
                  </div>

                  <div className={styles.field}>
                    <label>Operador</label>
                    <select
                      value={cfg.op || "=="}
                      onChange={(e) =>
                        updateSelectedNode({
                          config: { ...cfg, op: e.target.value as ConditionalConfig["op"] }
                        })
                      }
                    >
                      <option value="==">==</option>
                      <option value="!=">!=</option>
                      <option value=">">{">"}</option>
                      <option value="<">{"<"}</option>
                      <option value="contains">contains</option>
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label>Right (valor)</label>
                    <input
                      value={cfg.rightValue || ""}
                      onChange={(e) => updateSelectedNode({ config: { ...cfg, rightValue: e.target.value } })}
                      placeholder="200"
                    />
                  </div>

                  <div className={styles.small}>
                    Tip: conecta desde este nodo usando los handles TRUE y FALSE (salidas).
                  </div>
                </>
              )
            })()}
          </>
        )}

        {selectedNode.type === "end" && (
          <div className={styles.small}>Nodo final: no requiere configuración.</div>
        )}

        {selectedNode.type === "start" && (
          <div className={styles.small}>Tip: solo debe existir 1 START en el workflow.</div>
        )}
      </div>
    </div>
  )
}
