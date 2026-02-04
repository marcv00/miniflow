import styles from "./Sidebar.module.css";
import type { Workflow, NodeType } from "../../models/workflow/types";

type SidebarState = {
  workflows: Workflow[];
  currentId: string | null;
  name: string;
  description: string;
};

type SidebarHandlers = {
  createNewWorkflow: () => void;
  setName: (v: string) => void;
  setDescription: (v: string) => void;

  addNode: (type: NodeType) => void;

  setCurrentId: (id: string) => void;
};

type SidebarProps = {
  state: SidebarState;
  handlers: SidebarHandlers;
};

export function Sidebar({ state, handlers }: SidebarProps) {
  return (
    <div className={styles.sidebar}>
      <div className={styles.sectionTitle}>Workflows</div>

      <button className={styles.btn} onClick={handlers.createNewWorkflow}>
        + Nuevo workflow
      </button>

      <div className={styles.card}>
        <div className={styles.field}>
          <label>Nombre</label>
          <input
            value={state.name}
            onChange={(e) => handlers.setName(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label>Descripción</label>
          <textarea
            value={state.description}
            onChange={(e) => handlers.setDescription(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.sectionTitle}>Nodos</div>

      <div style={{ display: "grid", gap: "8px", marginBottom: "16px" }}>
        <button className={styles.btn} onClick={() => handlers.addNode("start")}>
          + START
        </button>
        <button className={styles.btn} onClick={() => handlers.addNode("command")}>
          + COMMAND
        </button>
        <button
          className={styles.btn}
          onClick={() => handlers.addNode("http_request")}
        >
          + HTTP_REQUEST
        </button>
        <button
          className={styles.btn}
          onClick={() => handlers.addNode("conditional")}
        >
          + CONDITIONAL
        </button>
        <button className={styles.btn} onClick={() => handlers.addNode("end")}>
          + END
        </button>
      </div>

      <div className={styles.sectionTitle}>Lista</div>

      {state.workflows.map((w) => (
        <div
          key={w.id}
          className={`${styles.workflowListItem} ${
            w.id === state.currentId ? styles.active : ""
          }`}
          onClick={() => handlers.setCurrentId(w.id)}
        >
          <strong>{w.name}</strong>
          <div className={styles.small}>{w.description || "—"}</div>
        </div>
      ))}
    </div>
  );
}
