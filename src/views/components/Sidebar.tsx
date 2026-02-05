import styles from "./Sidebar.module.css";

export function Sidebar({ state, handlers }: any) {
  return (
    <div className={styles.sidebar}>

      <button className={styles.btn} onClick={handlers.createNewWorkflow}>
        + Nuevo workflow
      </button>

      <button className={styles.btn} onClick={handlers.createWorkflow1}>
        + Plantilla Workflow 1
      </button>
      <div className={styles.card}>
        <div className={styles.sectionTitle}>Workflow Actual</div>
        <div className={styles.field}>
          <label>Nombre</label>
          <input value={state.name} onChange={(e) => handlers.setName(e.target.value)} />
        </div>

        <div className={styles.field}>
          <label>Descripción</label>
          <textarea value={state.description} onChange={(e) => handlers.setDescription(e.target.value)} />
        </div>
      </div>

      <div className={styles.sectionTitle}>Catalogo de Nodos</div>

      <div style={{ display: "grid", gap: "8px", marginBottom: "16px" }}>
        <button className={styles.btn} onClick={() => handlers.addNode("start")}>+ START</button>
        <button className={styles.btn} onClick={() => handlers.addNode("http_request")}>+ HTTP_REQUEST</button>
        <button className={styles.btn} onClick={() => handlers.addNode("conditional")}>+ CONDITIONAL</button>
        <button className={styles.btn} onClick={() => handlers.addNode("command")}>+ COMMAND</button>
        <button className={styles.btn} onClick={() => handlers.addNode("end")}>+ END</button>
      </div>

      <div className={styles.sectionTitle}>Workflows</div>

      {state.workflows.map((w: any) => (
        <div
          key={w.id}
          className={`${styles.workflowListItem} ${w.id === state.currentId ? styles.active : ""}`}
          onClick={() => handlers.setCurrentId(w.id)}
        >
          <strong>{w.name}</strong>
          <div className={styles.small}>{w.description || "—"}</div>
        </div>
      ))}
    </div>
  );
}
