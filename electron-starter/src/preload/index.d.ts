declare global {
  interface Window {
    electronApi: {
      platform: NodeJS.Platform
      isMac: boolean
    }
  }
}

export {}
