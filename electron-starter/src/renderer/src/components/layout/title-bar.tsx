import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

export default function TitleBar(): JSX.Element {
  const { t } = useTranslation('common')
  return (
    <div className="titlebar app-drag" role="banner">
      <div className="titlebar__left app-no-drag">
        <span className="titlebar__title">{t('app.title')}</span>
      </div>
      <div className="titlebar__right app-no-drag">{/* actions placeholder */}</div>
    </div>
  )
}
