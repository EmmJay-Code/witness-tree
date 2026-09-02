import { useMemo, useState } from 'react'
import type { Kingdom } from '../types'
import { KINGDOMS } from '../types'
import { formatShortDate, parseIsoDate } from '../lib/calendar'
import { KINGDOM_META, phaseMeta } from '../lib/phenophases'
import { speciesById } from '../lib/ids'
import { useStore } from '../state/store'

export function Log() {
  const { observations, customSpecies, selectedId, setSelectedId, query, setQuery, openForm } =
    useStore()
  const [kingdom, setKingdom] = useState<Kingdom | 'all'>('all')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return observations.filter((o) => {
      const sp = speciesById(customSpecies, o.speciesId)
      if (kingdom !== 'all' && sp?.kingdom !== kingdom) return false
      if (!q) return true
      return (
        (sp?.commonName ?? '').toLowerCase().includes(q) ||
        (sp?.scientificName ?? '').toLowerCase().includes(q) ||
        o.notes.toLowerCase().includes(q) ||
        phaseMeta(o.phenophase).label.toLowerCase().includes(q)
      )
    })
  }, [observations, customSpecies, kingdom, query])

  return (
    <div className="log">
      <header className="view-head">
        <div>
          <p className="kicker">Field log</p>
          <h2>{rows.length} records</h2>
        </div>
        <button className="btn" type="button" onClick={() => openForm()}>
          Log a first
        </button>
      </header>

      <div className="filters">
        <input
          type="search"
          placeholder="Search the log"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search the log"
        />
        <select
          value={kingdom}
          onChange={(e) => setKingdom(e.target.value as Kingdom | 'all')}
          aria-label="Filter by kind"
        >
          <option value="all">All kinds</option>
          {KINGDOMS.map((k) => (
            <option key={k} value={k}>
              {KINGDOM_META[k].plural}
            </option>
          ))}
        </select>
      </div>

      {rows.length === 0 ? (
        <p className="empty">
          The book is open. When something happens for the first time this year — a chorus, a bloom, a
          frost — put it here.
        </p>
      ) : (
        <ol className="log-list">
          {rows.map((o) => {
            const sp = speciesById(customSpecies, o.speciesId)
            return (
              <li key={o.id}>
                <button
                  type="button"
                  className={`log-row ${selectedId === o.id ? 'is-selected' : ''}`}
                  onClick={() => setSelectedId(o.id)}
                >
                  <time dateTime={o.date}>{formatShortDate(parseIsoDate(o.date))}</time>
                  <span className="swatch" style={{ background: KINGDOM_META[sp?.kingdom ?? 'other'].color }} />
                  <span className="log-body">
                    <strong>{sp?.commonName ?? o.speciesId}</strong>
                    <em>{phaseMeta(o.phenophase).label}</em>
                    {o.notes ? <span className="muted">{o.notes}</span> : null}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
