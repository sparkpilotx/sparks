import TitleBar from '@components/layout/title-bar'
import TrpcDemo from '@components/demo/trpc-demo'

export default function App(): React.JSX.Element {
  return (
    <>
      <TitleBar />
      <main className="app-shell">
        <TrpcDemo />
      </main>
    </>
  )
}
