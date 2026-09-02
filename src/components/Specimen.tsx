import { formatShortDate, parseIsoDate } from '../lib/calendar'
import { KINGDOM_META, phaseMeta } from '../lib/phenophases'
import { compareYears } from '../lib/prompts'
import { speciesById } from '../lib/ids'
import { useStore } from '../state/store'

export function Specimen() {
  const { observations, customSpecies, selectedId, setSelectedId, openForm, removeObservation } =
    useStore()
  const obs = observations.find((o) => o.id === selectedId)
  if (!obs) {
    return (
      <div className="specimen empty-specimen">
        <p className="kicker">Specimen</p>
        <h2>Nothing pinned.</h2>
        <p className="muted">
          Click a mark on the ring, or a row in the log. Click an empty stretch of the ring to date a
          new record.
        </p>
      </div>
    )
  }

  const sp = speciesById(customSpecies, obs.speciesId)
  const history = compareYears(observations, obs.speciesId, obs.phenophase)
  const thisDoy = history.find((h) => h.date === obs.date)?.doy
  const others = history.filter((h) => h.date !== obs.date)

  return (
    <div className="specimen">
      <p className="kicker">{KINGDOM_META[sp?.kingdom ?? 'other'].label}</p>
      <h2>{sp?.commonName ?? 'Unknown'}</h2>
      {sp?.scientificName ? <p className="sci">{sp.scientificName}</p> : null}
      <p className="phase-line">
        {phaseMeta(obs.phenophase).label}
        <span> · {formatShortDate(parseIsoDate(obs.date))}</span>
      </p>
      {obs.notes ? <blockquote>{obs.notes}</blockquote> : null}

      {others.length > 0 && thisDoy !== undefined && (
        <section>
          <p className="kicker">Earlier rings</p>
          <ul className="history">
            {others.map((h) => {
              const delta = thisDoy - h.doy
              const word =
                delta === 0
                  ? 'same day'
                  : delta > 0
                    ? `${delta} day${delta === 1 ? '' : 's'} later`
                    : `${Math.abs(delta)} day${Math.abs(delta) === 1 ? '' : 's'} earlier`
              return (
                <li key={h.year}>
                  {h.year}: {h.date} ({word})
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {sp?.notes ? <p className="muted">{sp.notes}</p> : null}

      <div className="form-actions">
        <button type="button" className="btn btn-quiet" onClick={() => openForm(obs.date, obs.id)}>
          Revise
        </button>
        <button
          type="button"
          className="text-btn danger"
          onClick={() => void removeObservation(obs.id)}
        >
          Strike from the book
        </button>
        <button type="button" className="text-btn" onClick={() => setSelectedId(null)}>
          Unpin
        </button>
      </div>
    </div>
  )
}
