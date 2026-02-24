import { useState, useEffect, useCallback, type ComponentType } from "react";
import {
    Zap, Globe, GitBranch, Terminal, Flag,
    X, FlaskConical
} from "lucide-react";
import { CustomSelect } from "./CustomSelect";
import styles from "./NodeConfigModal.module.css";
import type { NodeConfig, NodeData } from "../../models/workflow/types";
import type { NodePatch } from "../../viewmodels/helpers/nodePatch";
import type { Node } from "reactflow";
const TYPE_META: Record<string, {
    icon: ComponentType<{ size: number; color?: string; strokeWidth?: number }>;
    color: string;
    label: string
}> = {
    start: { icon: Zap, color: "#28b478", label: "START" },
    http_request: { icon: Globe, color: "#78b4ff", label: "HTTP_REQUEST" },
    conditional: { icon: GitBranch, color: "#f5a623", label: "CONDITIONAL" },
    command: { icon: Terminal, color: "#a78bfa", label: "COMMAND" },
    end: { icon: Flag, color: "#d23750", label: "END" },
};

interface Props {
    node: Node<NodeData>;  
    onSave: (nodeId: string, patch: NodePatch) => void;
    onClose: () => void;
}

// Helper para leer valores del config de forma segura
const str = (v: unknown, fallback = ""): string =>
    typeof v === "string" ? v : fallback;
const num = (v: unknown, fallback: number): number =>
    typeof v === "number" ? v : fallback;
const mapField = (map: unknown, key: string): string => {
    if (typeof map === "object" && map !== null) {
        const val = (map as Record<string, unknown>)[key];
        return typeof val === "string" ? val : "";
    }
    return "";
};

export function NodeConfigModal({ node, onSave, onClose }: Props) {
    const type = node?.type || "start";
    const meta = TYPE_META[type] || TYPE_META.start;
    const Icon = meta.icon;

    const [label, setLabel] = useState(node?.data?.label || "");
    const [config, setConfig] = useState<Record<string, unknown>>({ ...(node?.data?.config || {}) });
    const [testResult, setTestResult] = useState<string | null>(null);

    

    const handleEscape = useCallback((e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
    }, [onClose]);

    useEffect(() => {
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [handleEscape]);

    if (!node) return null;

    const patchConfig = (key: string, value: unknown) =>
        setConfig((c) => ({ ...c, [key]: value }));

    const patchMap = (key: string, value: string) =>
        setConfig((c) => ({ ...c, map: { ...((c.map as Record<string, string>) || {}), [key]: value } }));

    const handleSave = () => {
        onSave(node.id, { label, config: config as NodeConfig });
        onClose();
    };

    const handleTest = () => {
        setTestResult("⏳ Función disponible próximamente — requiere integración con el motor de ejecución.");
    };

    const canTest = type === "http_request" || type === "command" || type === "conditional";

    return (
        <div className={styles.backdrop} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                {/* ── Header ── */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <Icon size={18} color={meta.color} strokeWidth={2.2} />
                        <span className={styles.headerType} style={{ color: meta.color }}>{meta.label}</span>
                    </div>
                    <div className={styles.headerRight}>
                        {canTest && (
                            <button className={styles.testBtn} onClick={handleTest}>
                                <FlaskConical size={14} /> Probar
                            </button>
                        )}
                        <button className={styles.closeBtn} onClick={onClose}>
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* ── Body ── */}
                <div className={styles.body}>
                    <div className={styles.field}>
                        <label>Etiqueta</label>
                        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Nombre del nodo" />
                    </div>

                    {/* ── START ── */}
                    {type === "start" && (
                        <div className={styles.infoBox}>
                            El nodo Start es el punto de entrada del workflow. Solo puede existir uno por workflow.
                        </div>
                    )}

                    {/* ── END ── */}
                    {type === "end" && (
                        <div className={styles.infoBox}>
                            El nodo End finaliza la ejecución del workflow.
                        </div>
                    )}

                    {/* ── HTTP_REQUEST ── */}
                    {type === "http_request" && (
                        <>
                            <div className={styles.sectionLabel}>Parámetros</div>

                            <div className={styles.row2}>
                                <div className={styles.field}>
                                    <label>Método</label>
                                    <CustomSelect
                                        value={str(config.method, "GET")}
                                        onChange={v => patchConfig("method", v)}
                                        options={[
                                            { value: "GET", label: "GET" },
                                            { value: "POST", label: "POST" },
                                            { value: "PUT", label: "PUT" },
                                            { value: "PATCH", label: "PATCH" },
                                            { value: "DELETE", label: "DELETE" },
                                        ]}
                                    />
                                </div>
                                <div className={styles.field} style={{ flex: 2 }}>
                                    <label>URL</label>
                                    <input value={str(config.url)} onChange={e => patchConfig("url", e.target.value)} placeholder="https://api.ejemplo.com/v1/recurso" />
                                </div>
                            </div>

                            <div className={styles.field}>
                                <label>Headers (JSON)</label>
                                <textarea value={str(config.headers)} onChange={e => patchConfig("headers", e.target.value)} placeholder={'{"Authorization": "Bearer token"}'} rows={2} />
                            </div>

                            <div className={styles.field}>
                                <label>Query Parameters (JSON)</label>
                                <textarea value={str(config.queryParams)} onChange={e => patchConfig("queryParams", e.target.value)} placeholder={'{"page": "1", "limit": "10"}'} rows={2} />
                            </div>

                            {str(config.method, "GET") !== "GET" && (
                                <div className={styles.field}>
                                    <label>Body (JSON)</label>
                                    <textarea value={str(config.body)} onChange={e => patchConfig("body", e.target.value)} placeholder={'{"key": "value"}'} rows={3} />
                                </div>
                            )}

                            <div className={styles.sectionLabel}>Timeout y reintentos</div>
                            <div className={styles.row2}>
                                <div className={styles.field}>
                                    <label>Timeout (ms)</label>
                                    <input type="number" value={num(config.timeoutMs, 5000)} onChange={e => patchConfig("timeoutMs", Number(e.target.value))} />
                                </div>
                                <div className={styles.field}>
                                    <label>Reintentos</label>
                                    <input type="number" value={num(config.retries, 3)} onChange={e => patchConfig("retries", Number(e.target.value))} />
                                </div>
                            </div>

                            <div className={styles.sectionLabel}>Mapeo de respuesta</div>
                            <div className={styles.row2}>
                                <div className={styles.field}>
                                    <label>Mapeo status (JSONPath)</label>
                                    <input value={mapField(config.map, "status")} onChange={e => patchMap("status", e.target.value)} placeholder="$.statusCode" />
                                </div>
                                <div className={styles.field}>
                                    <label>Mapeo payload (JSONPath)</label>
                                    <input value={mapField(config.map, "payload")} onChange={e => patchMap("payload", e.target.value)} placeholder="$.data" />
                                </div>
                            </div>
                        </>
                    )}

                    {/* ── COMMAND ── */}
                    {type === "command" && (
                        <>
                            <div className={styles.sectionLabel}>Parámetros</div>

                            <div className={styles.row2}>
                                <div className={styles.field}>
                                    <label>Comando</label>
                                    <input value={str(config.command)} onChange={e => patchConfig("command", e.target.value)} placeholder="python" />
                                </div>
                                <div className={styles.field}>
                                    <label>Ruta de script</label>
                                    <input value={str(config.scriptPath)} onChange={e => patchConfig("scriptPath", e.target.value)} placeholder="C:\Users\...\script.py" />
                                </div>
                            </div>

                            <div className={styles.field}>
                                <label>Argumentos</label>
                                <input value={str(config.args)} onChange={e => patchConfig("args", e.target.value)} placeholder="--verbose --output result.json" />
                            </div>

                            <div className={styles.field}>
                                <label>Variables de entorno (JSON, opcional)</label>
                                <textarea value={str(config.envVars)} onChange={e => patchConfig("envVars", e.target.value)} placeholder={'{"API_KEY": "xxx"}'} rows={2} />
                            </div>

                            <div className={styles.row2}>
                                <div className={styles.field}>
                                    <label>Directorio de ejecución</label>
                                    <input value={str(config.cwd)} onChange={e => patchConfig("cwd", e.target.value)} placeholder="C:\proyecto\" />
                                </div>
                                <div className={styles.field}>
                                    <label>Timeout (ms)</label>
                                    <input type="number" value={num(config.timeoutMs, 30000)} onChange={e => patchConfig("timeoutMs", Number(e.target.value))} />
                                </div>
                            </div>

                            <div className={styles.row2}>
                                <div className={styles.field}>
                                    <label>Captura de salida</label>
                                    <CustomSelect
                                        value={str(config.captureOutput, "stdout")}
                                        onChange={v => patchConfig("captureOutput", v)}
                                        options={[
                                            { value: "stdout", label: "stdout" },
                                            { value: "stderr", label: "stderr" },
                                            { value: "both", label: "both" },
                                        ]}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label>Output key (contexto)</label>
                                    <input value={str(config.outputKey)} onChange={e => patchConfig("outputKey", e.target.value)} placeholder="commandResult" />
                                </div>
                            </div>
                        </>
                    )}

                    {/* ── CONDITIONAL ── */}
                    {type === "conditional" && (
                        <>
                            <div className={styles.sectionLabel}>Condición</div>

                            <div className={styles.conditionRow}>
                                <div className={styles.field} style={{ flex: 2 }}>
                                    <label>Operando izquierdo</label>
                                    <input value={str(config.leftOperand)} onChange={e => patchConfig("leftOperand", e.target.value)} placeholder="{{response.status}}" />
                                </div>
                                <div className={styles.field} style={{ flex: 1 }}>
                                    <label>Operador</label>
                                    <CustomSelect
                                        value={str(config.operator, "==")}
                                        onChange={v => patchConfig("operator", v)}
                                        options={[
                                            { value: "==", label: "==" },
                                            { value: "!=", label: "!=" },
                                            { value: ">", label: ">" },
                                            { value: "<", label: "<" },
                                            { value: ">=", label: ">=" },
                                            { value: "<=", label: "<=" },
                                            { value: "contains", label: "contains" },
                                        ]}
                                    />
                                </div>
                                <div className={styles.field} style={{ flex: 2 }}>
                                    <label>Operando derecho</label>
                                    <input value={str(config.rightOperand)} onChange={e => patchConfig("rightOperand", e.target.value)} placeholder="200" />
                                </div>
                            </div>

                            {(config.leftOperand || config.rightOperand) && (
                                <div className={styles.conditionPreview}>
                                    <span className={styles.previewLabel}>Preview:</span>
                                    <code>{str(config.leftOperand, "?")} {str(config.operator, "==")} {str(config.rightOperand, "?")}</code>
                                </div>
                            )}

                            <div className={styles.field}>
                                <label>Expresión completa (alternativo)</label>
                                <input value={str(config.condition)} onChange={e => patchConfig("condition", e.target.value)} placeholder="context.status == 200" />
                            </div>

                            <div className={styles.infoBox}>
                                Las rutas TRUE y FALSE se asignan automáticamente a los handles del nodo.
                            </div>

                            <div className={styles.sectionLabel}>Configuración</div>
                            <div className={styles.field}>
                                <label>Política de error</label>
                                <CustomSelect
                                    value={str(config.errorPolicy, "STOP_ON_FAIL")}
                                    onChange={v => patchConfig("errorPolicy", v)}
                                    options={[
                                        { value: "STOP_ON_FAIL", label: "STOP_ON_FAIL" },
                                        { value: "CONTINUE_ON_FAIL", label: "CONTINUE_ON_FAIL" },
                                    ]}
                                />
                            </div>
                        </>
                    )}

                    {/* ── Test Result ── */}
                    {testResult && (
                        <div className={styles.testResultBox}>
                            <pre>{testResult}</pre>
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className={styles.footer}>
                    <button className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
                    <button className={styles.saveBtn} onClick={handleSave}>Guardar</button>
                </div>
            </div>
        </div>
    );
}
