import { useState } from "react";
import { loadAll, saveAll } from "../models/storage/LocalStorage";
import type { Workflow } from "../models/workflow/types";

export function useWorkflowStorage() {
  const [workflows, setWorkflows] = useState<Workflow[]>(() => {
    const arr = loadAll().filter(w => (w?.name || "").toUpperCase() !== "WORKFLOW_2");
    saveAll(arr);
    return arr;
  });
  const [currentId, setCurrentId] = useState<string | null>(() => workflows[0]?.id ?? null);

  const persist = (wf: Workflow) => {
    const next = [...workflows];
    const idx = next.findIndex(w => w.id === wf.id);
    if (idx >= 0) next[idx] = wf;
    else next.unshift(wf);
    setWorkflows(next);
    saveAll(next);
    setCurrentId(wf.id);
  };

  const remove = (id: string) => {
    const next = workflows.filter(w => w.id !== id);
    setWorkflows(next);
    saveAll(next);
    setCurrentId(next[0]?.id || null);
  };

  return { workflows, currentId, setCurrentId, persist, remove };
}