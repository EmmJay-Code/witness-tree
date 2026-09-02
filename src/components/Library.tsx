import { useMemo, useState } from 'react'
import type { Kingdom, Species } from '../types'
import { KINGDOMS } from '../types'
import { KINGDOM_META, phaseMeta } from '../lib/phenophases'
import { compareYears } from '../lib/prompts'
import { makeId } from '../lib/ids'
import { useStore } from '../state/store'

export function Library() {
  const { species, observations, saveCustomSpecies, removeCustomSpecies } = useStore()
  const [q, setQ] = useState('')
  const [kingdom, setKingdom] = useState<Kingdom | 'all'>('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [sci, setSci] = useState('')
  const [kind, setKind] = useState<Kingdom>('plant')

  const list = useMemo(() => {
    const query = q.trim().toLowerCase()
    return species.filter((s) => {
      if (kingdom !== 'all' && s.kingdom !== kingdom) return false
      if (!query) return true
      return (
        s.commonName.toLowerCase().includes(query) ||
        s.scientificName.toLowerCase().includes(query) ||
        s.notes.toLowerCase().includes(query)
      )
    })
  }, [species, q, kingdom])

  async function addSpecies() {
    if (!name.trim()) return
    const entry: Species = {
      id: `custom-${makeId()}`,
      commonName: name.trim(),
      scientificName: sci.trim(),
      kingdom: kind,
      notes: 'Added at this station.',
      typical: [],
      custom: true,
    }
    await saveCustomSpecies(entry)
    setName('')
    setSci('')
    setAdding(false)
    setOpenId(entry.id)
  }

  return (
    <div className="library">
      <header className="view-head">
        <div>
          <p className="kicker">Station library</p>
          <h2>{list.length} names</h2>
        </div>
        <button className="btn btn-quiet" type="button" onClick={() => setAdding((v) => !v)}>
          {adding ? 'Cancel' : 'Add a name'}
        </button>
      </header>

      <div className="filters">
        <input
          type="search"
          placeholder="Look up a species"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={kingdom} onChange={(e) => setKingdom(e.target.value as Kingdom | 'all')}>
          <option value="all">All kinds</option>
          {KINGDOMS.map((k) => (
            <option key={k} value={k}>
              {KINGDOM_META[k].plural}
            </option>
          ))}
        </select>
      </div>

      {adding && (
        <div className="custom-box">
          <label className="field">
            <span>Common name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="field">
            <span>Scientific name</span>
            <input value={sci} onChange={(e) => setSci(e.target.value)} />
          </label>
          <label className="field">
            <span>Kind</span>
            <select value={kind} onChange={(e) => setKind(e.target.value as Kingdom)}>
              {KINGDOMS.map((k) => (
                <option key={k} value={k}>
                  {KINGDOM_META[k].label}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="btn" onClick={() => void addSpecies()}>
            Keep in library
          </button>
        </div>
      )}

      <ul className="lib-list">
        {list.map((s) => {
          const open = openId === s.id
          const history = s.typical.flatMap((t) =>
            compareYears(observations, s.id, t.phase).map((row) => ({
              ...row,
              phase: t.phase,
            })),
          )
          return (
            <li key={s.id} className={open ? 'is-open' : ''}>
              <button type="button" className="lib-row" onClick={() => setOpenId(open ? null : s.id)}>
                <span className="swatch" style={{ background: KINGDOM_META[s.kingdom].color }} />
                <span>
                  <strong>{s.commonName}</strong>
                  <em>{s.scientificName || KINGDOM_META[s.kingdom].label}</em>
                </span>
              </button>
              {open && (
                <div className="lib-detail">
                  {s.notes && <p>{s.notes}</p>}
                  {s.typical.length > 0 && (
                    <p className="muted">
                      Typical windows (northern temperate):{' '}
                      {s.typical
                        .map((t) => `${phaseMeta(t.phase).label} ${t.startDoy}–${t.endDoy}`)
                        .join(' · ')}
                    </p>
                  )}
                  {history.length > 0 && (
                    <ul className="history">
                      {history.map((h) => (
                        <li key={`${h.year}-${h.phase}`}>
                          {h.year}: {phaseMeta(h.phase as typeof s.typical[number]['phase']).label} on{' '}
                          {h.date}
                        </li>
                      ))}
                    </ul>
                  )}
                  {s.custom && (
                    <button
                      type="button"
                      className="text-btn danger"
                      onClick={() => void removeCustomSpecies(s.id)}
                    >
                      Remove from library
                    </button>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
