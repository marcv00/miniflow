import { useRef } from "react";
import { exportWorkflowJson, exportWorkflowJava } from "../models/workflow/WorkflowExporters";
import { validate } from "../models/workflow/WorkflowValidator";
import type { Workflow } from "../models/workflow/types";

export function useWorkflowIO(persist: (wf: Workflow) => void) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportJson = (wf: Workflow) => exportWorkflowJson(wf);
  const exportJava = (wf: Workflow) => exportWorkflowJava(wf);
  
  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const obj = JSON.parse(text);
      if (obj.nodes && obj.edges) {
        const errs = validate(obj.nodes, obj.edges);
        if (errs.length) {
          const msg = ["No se puede importar: el workflow es inválido.", "", ...errs.slice(0, 6)].join("\n");
          alert(msg);
          return;
        }
        persist({ ...obj, id: obj.id || crypto.randomUUID() });
      }
    } catch {
      alert("Error al importar JSON.");
    }
    e.target.value = "";
  };

  return { 
    fileInputRef, 
    exportJson, 
    exportJava, 
    onImportFile, 
    openImport: () => fileInputRef.current?.click() 
  };
}
