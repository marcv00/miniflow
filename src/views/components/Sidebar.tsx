import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Zap, Globe, GitBranch, Terminal, Flag,
  ChevronDown, ChevronRight,
  Save, CheckCircle, Play,
  ArrowLeft, PanelLeftClose, PanelLeftOpen
} from "lucide-react";
import styles from "./Sidebar.module.css";
import type { NodeType } from "../../models/workflow/types";

const NODE_PALETTE = [
  { type: "start" as NodeType, label: "Start", icon: Zap, color: "#28b478" },
  { type: "http_request" as NodeType, label: "HTTP Request", icon: Globe, color: "#78b4ff" },
  { type: "conditional" as NodeType, label: "Condicional", icon: GitBranch, color: "#f5a623" },
  { type: "command" as NodeType, label: "Comando", icon: Terminal, color: "#a78bfa" },
  { type: "end" as NodeType, label: "Fin", icon: Flag, color: "#d23750" },
];

interface SidebarProps {
  state: {
    name: string;
    nodes: any[];
    edges: any[];
    hasValidated: boolean;
    errors: string[];
  };
  handlers: {
    addNode: (type: NodeType) => void;
    saveCurrent: () => void;
    validateNow: () => void;
    executeNow: () => void;
  };
}

function SectionHeader({ title, open, onToggle, collapsed }: { title: string; open: boolean; onToggle: () => void; collapsed: boolean }) {
  if (collapsed) return null;
  return (
    <button className={styles.sectionHeader} onClick={onToggle}>
      {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      <span>{title}</span>
    </button>
  );
}

export function Sidebar({ state, handlers }: SidebarProps) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [nodesOpen, setNodesOpen] = useState(true);
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [actionsOpen, setActionsOpen] = useState(true);

  const validationStatus = !state.hasValidated
    ? "pending"
    : state.errors.length === 0
      ? "valid"
      : "invalid";

  const statusLabel = validationStatus === "valid" ? "Válido" : validationStatus === "invalid" ? "Inválido" : "Pendiente";

  return (
    <div className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      {/* ── Top: Brand + Toggle ── */}
      <div className={styles.topRow}>
        {!collapsed && (
          <div className={styles.brand} onClick={() => navigate("/workflows")}>
            <span className={styles.brandLogo}>MINIFLOW</span>
          </div>
        )}
        <button
          className={styles.toggleBtn}
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Abrir sidebar" : "Cerrar sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {!collapsed && (
        <div className={styles.brandSub}>{state.name || "Sin título"}</div>
      )}

      <div className={styles.divider} />

      {/* ── Scrollable content ── */}
      <div className={styles.scrollArea}>

        {/* ── Nodos ── */}
        <SectionHeader title="Nodos Disponibles" open={nodesOpen} onToggle={() => setNodesOpen(!nodesOpen)} collapsed={collapsed} />
        <div className={`${styles.sectionBody} ${(collapsed || nodesOpen) ? styles.sectionOpen : ""}`}>
          <div className={styles.nodeGrid}>
            {NODE_PALETTE.map(n => {
              const Icon = n.icon;
              return (
                <button
                  key={n.type}
                  className={`${styles.nodeCard} ${collapsed ? styles.nodeCardCollapsed : ""}`}
                  onClick={() => handlers.addNode(n.type)}
                  title={collapsed ? n.label : undefined}
                >
                  <Icon size={16} color={n.color} strokeWidth={2.2} />
                  {!collapsed && <span>{n.label}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {!collapsed && <div className={styles.divider} />}

        {/* ── Resumen ── */}
        {!collapsed && (
          <>
            <SectionHeader title="Resumen" open={summaryOpen} onToggle={() => setSummaryOpen(!summaryOpen)} collapsed={collapsed} />
            <div className={`${styles.sectionBody} ${summaryOpen ? styles.sectionOpen : ""}`}>
              <div className={styles.summaryCard}>
                <div className={styles.summaryRow}>
                  <span>{state.nodes.length} nodos</span>
                  <span className={styles.summaryDot}>·</span>
                  <span>{state.edges.length} conexiones</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={`${styles.statusDot} ${styles[`status_${validationStatus}`]}`} />
                  <span>{statusLabel}</span>
                </div>
              </div>
            </div>

            <div className={styles.divider} />
          </>
        )}

        {/* ── Acciones Rápidas ── */}
        <SectionHeader title="Acciones Rápidas" open={actionsOpen} onToggle={() => setActionsOpen(!actionsOpen)} collapsed={collapsed} />
        <div className={`${styles.sectionBody} ${(collapsed || actionsOpen) ? styles.sectionOpen : ""}`}>
          <div className={styles.actionGrid}>
            <button
              className={`${styles.actionBtn} ${collapsed ? styles.actionBtnCollapsed : ""}`}
              onClick={handlers.saveCurrent}
              title={collapsed ? "Guardar" : undefined}
            >
              <Save size={15} />
              {!collapsed && <span>Guardar</span>}
            </button>
            <button
              className={`${styles.actionBtn} ${collapsed ? styles.actionBtnCollapsed : ""}`}
              onClick={handlers.validateNow}
              title={collapsed ? "Validar" : undefined}
            >
              <CheckCircle size={15} />
              {!collapsed && <span>Validar</span>}
            </button>
            <button
              className={`${styles.actionBtn} ${styles.actionPrimary} ${collapsed ? styles.actionBtnCollapsed : ""}`}
              onClick={handlers.executeNow}
              title={collapsed ? "Ejecutar" : undefined}
            >
              <Play size={15} />
              {!collapsed && <span>Ejecutar</span>}
            </button>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className={styles.footer}>
        <button
          className={`${styles.backBtn} ${collapsed ? styles.backBtnCollapsed : ""}`}
          onClick={() => navigate("/workflows")}
          title={collapsed ? "Volver al Dashboard" : undefined}
        >
          <ArrowLeft size={14} />
          {!collapsed && <span>Volver al Dashboard</span>}
        </button>
      </div>
    </div>
  );
}
