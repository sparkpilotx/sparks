import TitleBar from './components/layout/title-bar'

export default function App(): React.JSX.Element {
  return (
    <>
      <TitleBar />
      <main className="app-shell">{/* app content goes here */}</main>
    </>
  )
}
