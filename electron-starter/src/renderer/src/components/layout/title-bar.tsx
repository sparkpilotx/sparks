import type { JSX } from 'react'

export default function TitleBar(): JSX.Element {
  return (
    <div className="titlebar app-drag" role="banner">
      <div className="titlebar__left app-no-drag">
        <span className="titlebar__title">electron-starter</span>
      </div>
      <div className="titlebar__right app-no-drag">{/* actions placeholder */}</div>
    </div>
  )
}
