import 'i18next'
import type { AppI18nResources } from './resources'

declare module 'i18next' {
  // Augment default resources to get typed t('...')
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: AppI18nResources
  }
}
