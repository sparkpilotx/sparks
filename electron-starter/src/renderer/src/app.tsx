import TitleBar from '@components/layout/title-bar'
import TrpcExample from '@components/examples/trpc-example'

export default function App(): React.JSX.Element {
  return (
    <>
      <TitleBar />
      <main className="app-shell">
        <TrpcExample />
      </main>
    </>
  )
}
