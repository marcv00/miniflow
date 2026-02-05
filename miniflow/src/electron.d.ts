export {}

declare global {
  interface Window {
    electronAPI: {
      saveJson: (content: string) => Promise<boolean>
      openJson: () => Promise<string | null>
      runJavaTest: (folderName: string) => Promise<boolean>
    }
  }
}
