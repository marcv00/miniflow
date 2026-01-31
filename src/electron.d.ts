export {}

declare global {
  interface Window {
    electronAPI: {
      saveJson: (content: string) => Promise<boolean>
      openJson: () => Promise<string | null>
    }
  }
}
