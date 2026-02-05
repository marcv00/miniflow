import type { Workflow } from "./types"

export const exportTextFile = (
  content: string,
  filename: string,
  mime = "text/plain"
) => {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const exportWorkflowJson = (wf: Workflow) =>
  exportTextFile(
    JSON.stringify(wf, null, 2),
    `${wf.name.replaceAll(" ", "_")}.json`,
    "application/json"
  )

export const exportWorkflowJava = (wf: Workflow) => {
  const className = "Workflow_" + wf.name.replace(/\W+/g, "_")
  const json = JSON.stringify(wf, null, 2)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, "\\\"")
    .replace(/\n/g, "\\n")

  const java = `public class ${className} {
  public static final String WORKFLOW_JSON = "${json}";
}`
  exportTextFile(java, `${className}.java`)
}
