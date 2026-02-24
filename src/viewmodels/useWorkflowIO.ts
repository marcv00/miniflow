import { useRef } from "react";
import { exportWorkflowJson, exportWorkflowJava } from "../models/workflow/WorkflowExporters";
import { validate } from "../models/workflow/WorkflowValidator";
import type { Workflow } from "../models/workflow/types";

export function useWorkflowIO(persist: (wf: Workflow) => void) {
  const fileInputRef = useRef<HTMLInputElement>(null);

 
  
  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const obj = JSON.parse(text);
      if (obj.nodes && obj.edges) {
        const report = validate(obj.nodes, obj.edges);
      if (!report.isValid) {
          const msgs = report.issues
              .filter(i => i.severity === "error")
              .slice(0, 6)
              .map(i => i.message);
          alert(["No se puede importar: el workflow es inválido.", "", ...msgs].join("\n"));
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
    exportJson: exportWorkflowJson,
    exportJava: exportWorkflowJava,
    onImportFile, 
    openImport: () => fileInputRef.current?.click() 
  };
}
