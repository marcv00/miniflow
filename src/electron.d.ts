export {}

declare global {
  interface Window {
    electronAPI: {
      saveJson: (content: string) => Promise<boolean>
      openJson: () => Promise<string | null>
      runJavaTest: (folderName: string) => Promise<boolean>
      runWorkflow: (workflowJson: string) => Promise<{ ok: boolean; exitCode: number; stdout: string; stderr: string }>
    }
  }
}
