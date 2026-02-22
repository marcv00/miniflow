import { X, AlertCircle, AlertTriangle, Info, ArrowRight } from "lucide-react";
import type { ValidationReport, ValidationSeverity } from "../../models/workflow/types";
import styles from "./ValidationPanel.module.css";

interface Props {
    report: ValidationReport;
    onClose: () => void;
    onFocusNode: (nodeId: string) => void;
}

const severity: Record<ValidationSeverity, { icon: typeof AlertCircle; cls: string; label: string }> = {
    error: { icon: AlertCircle, cls: styles.sevError, label: "Error" },
    warning: { icon: AlertTriangle, cls: styles.sevWarning, label: "Advertencia" },
    info: { icon: Info, cls: styles.sevInfo, label: "Información" }
};

export default function ValidationPanel({ report, onClose, onFocusNode }: Props) {
    const errorCount = report.issues.filter(i => i.severity === "error").length;
    const warningCount = report.issues.filter(i => i.severity === "warning").length;
    const infoCount = report.issues.filter(i => i.severity === "info").length;

    return (
        <div className={styles.panel}>
            {/* ── Header ── */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <span className={styles.title}>Reporte de Validación</span>

                    {report.isValid ? (
                        <span className={styles.badgeValid}>✓ Workflow Válido</span>
                    ) : (
                        <span className={styles.badgeInvalid}>✗ Workflow Inválido</span>
                    )}

                    <span className={styles.sep} />

                    {errorCount > 0 && (
                        <span className={`${styles.count} ${styles.sevError}`}>
                            <AlertCircle size={14} /> {errorCount}
                        </span>
                    )}
                    {warningCount > 0 && (
                        <span className={`${styles.count} ${styles.sevWarning}`}>
                            <AlertTriangle size={14} /> {warningCount}
                        </span>
                    )}
                    {infoCount > 0 && (
                        <span className={`${styles.count} ${styles.sevInfo}`}>
                            <Info size={14} /> {infoCount}
                        </span>
                    )}
                </div>

                <button className={styles.closeBtn} onClick={onClose}>
                    <X size={16} />
                </button>
            </div>

            {/* ── Body ── */}
            <div className={styles.body}>
                {report.issues.length === 0 ? (
                    <div className={styles.emptyState}>
                        <AlertCircle size={28} className={styles.emptyIcon} />
                        <strong>¡Todo bien!</strong>
                        <span>No se encontraron problemas en el workflow</span>
                    </div>
                ) : (
                    report.issues.map((issue, i) => {
                        const sev = severity[issue.severity];
                        const Icon = sev.icon;

                        return (
                            <div key={i} className={styles.issueRow}>
                                <Icon size={18} className={sev.cls} />
                                <div className={styles.issueContent}>
                                    <div className={styles.issueHead}>
                                        <span className={`${styles.badge} ${sev.cls}`}>{sev.label}</span>
                                        {issue.nodeId && (
                                            <span className={styles.nodeTag}>Node: {issue.nodeId.substring(0, 8)}…</span>
                                        )}
                                    </div>
                                    <p className={styles.issueMsg}>{issue.message}</p>
                                    {issue.action === "focus" && issue.nodeId && (
                                        <button className={styles.focusBtn} onClick={() => onFocusNode(issue.nodeId!)}>
                                            Ir al nodo <ArrowRight size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ── Footer ── */}
            <div className={styles.footer}>
                {report.isValid
                    ? "El workflow está listo para ser ejecutado"
                    : "Corrige los errores antes de ejecutar el workflow"}
            </div>
        </div>
    );
}
