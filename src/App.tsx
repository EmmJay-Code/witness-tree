import { StoreProvider, useStore } from './state/store'
import { Onboarding } from './components/Onboarding'
import { Shell } from './components/Shell'

function Root() {
  const { ready, station } = useStore()

  if (!ready) {
    return (
      <div className="splash">
        <div className="onboard-mark" aria-hidden="true">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="60" cy="60" r="38" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="60" cy="60" r="22" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="82" cy="34" r="4" fill="currentColor" />
          </svg>
        </div>
        <p>Opening the ledger…</p>
      </div>
    )
  }

  if (!station) return <Onboarding />
  return <Shell />
}

export default function App() {
  return (
    <StoreProvider>
      <Root />
    </StoreProvider>
  )
}
