import { useState } from 'react'
import { isSampleStation } from '../lib/sample'
import { useStore } from '../state/store'

export function SampleBanner() {
  const { station, resetAll } = useStore()
  const [confirm, setConfirm] = useState(false)

  if (!isSampleStation(station)) return null

  return (
    <div className="sample-banner" role="status">
      <p>
        <span className="sample-banner-tag">Sample</span>
        You are walking Blackwood Hollow, a made-up station. Nothing here is yours yet.
      </p>
      {!confirm ? (
        <button type="button" className="btn" onClick={() => setConfirm(true)}>
          Start your own station
        </button>
      ) : (
        <div className="sample-banner-confirm">
          <p>This clears the sample records and opens a blank book.</p>
          <button type="button" className="btn" onClick={() => void resetAll()}>
            Yes, start over
          </button>
          <button type="button" className="btn btn-quiet" onClick={() => setConfirm(false)}>
            Stay here
          </button>
        </div>
      )}
    </div>
  )
}
