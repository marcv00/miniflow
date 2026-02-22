export { }

declare global {
  interface Window {
    electronAPI: {
      saveJson: (content: string) => Promise<boolean>
      openJson: () => Promise<string | null>
      runJavaTest: (folderName: string) => Promise<boolean>
      runWorkflow: (workflowJson: string) => Promise<{
        ok: boolean
        exitCode: number
        stdout: string
        stderr: string
        run: {
          runId: string
          workflowName: string
          status: string
          startedAt: string
          finishedAt: string
          steps: Array<{
            nodeId: string
            nodeType: string
            nodeLabel: string
            status: string
            startedAt: string
            finishedAt: string
            durationMs: number
            output: Record<string, any>
            error: string | null
          }>
        } | null
      }>
      testNode: (nodeJson: string) => Promise<{
        ok: boolean
        output: Record<string, any> | null
        error: string | null
        durationMs: number
      }>
    }
  }
}
