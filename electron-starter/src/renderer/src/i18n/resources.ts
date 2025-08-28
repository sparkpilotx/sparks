export const resources = {
  'en-US': {
    common: {
      app: {
        title: 'electron-starter',
      },
    },
  },
  'zh-CN': {
    common: {
      app: {
        title: '电⼦应用示例',
      },
    },
  },
} as const

export type AppI18nResources = (typeof resources)['en-US']
