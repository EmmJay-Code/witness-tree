import { useMemo, useState, type FormEvent } from 'react'
import type { PhenophaseId, Species } from '../types'
import { isoDate } from '../lib/calendar'
import { phasesForKingdom } from '../lib/phenophases'
import { makeId } from '../lib/ids'
import { useStore } from '../state/store'

export function ObservationForm() {
  const {
    station,
    observations,
    species,
    selectedId,
    formDate,
    closeForm,
    saveObservation,
    saveCustomSpecies,
  } = useStore()

  const existing = selectedId ? observations.find((o) => o.id === selectedId) : undefined
  const [speciesId, setSpeciesId] = useState(existing?.speciesId ?? '')
  const [search, setSearch] = useState('')
  const [phenophase, setPhenophase] = useState<PhenophaseId>(existing?.phenophase ?? 'first-seen')
  const [date, setDate] = useState(existing?.date ?? formDate ?? isoDate(new Date()))
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [customOpen, setCustomOpen] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customSci, setCustomSci] = useState('')
  const [customKingdom, setCustomKingdom] = useState<Species['kingdom']>('plant')

  const selectedSpecies = species.find((s) => s.id === speciesId)

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = q
      ? species.filter(
          (s) =>
            s.commonName.toLowerCase().includes(q) ||
            s.scientificName.toLowerCase().includes(q) ||
            s.kingdom.includes(q),
        )
      : species
    return list.slice(0, 8)
  }, [search, species])

  const phases = phasesForKingdom(selectedSpecies?.kingdom ?? 'other')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!speciesId) return
    await saveObservation({
      id: existing?.id,
      speciesId,
      phenophase,
      date,
      notes,
      lat: station?.lat,
      lon: station?.lon,
    })
    closeForm()
  }

  async function addCustom() {
    if (!customName.trim()) return
    const id = `custom-${makeId()}`
    const entry: Species = {
      id,
      commonName: customName.trim(),
      scientificName: customSci.trim(),
      kingdom: customKingdom,
      notes: '',
      typical: [],
      custom: true,
    }
    await saveCustomSpecies(entry)
    setSpeciesId(id)
    setSearch(entry.commonName)
    setCustomOpen(false)
    setCustomName('')
    setCustomSci('')
  }

  return (
    <form className="form" onSubmit={(e) => void onSubmit(e)}>
      <header className="form-head">
        <p className="kicker">{existing ? 'Revise a record' : 'Log a first'}</p>
        <h2>{existing ? 'Edit observation' : 'New observation'}</h2>
      </header>

      <label className="field">
        <span>Date</span>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </label>

      <label className="field">
        <span>Species or event</span>
        <input
          type="search"
          value={selectedSpecies && !search ? selectedSpecies.commonName : search}
          onChange={(e) => {
            setSearch(e.target.value)
            setSpeciesId('')
          }}
          placeholder="lilac, ice, peeper…"
          autoComplete="off"
        />
      </label>

      {!speciesId && (
        <ul className="typeahead">
          {matches.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => {
                  setSpeciesId(s.id)
                  setSearch('')
                  const next = phasesForKingdom(s.kingdom)
                  if (!next.some((p) => p.id === phenophase)) setPhenophase(next[0].id)
                }}
              >
                <strong>{s.commonName}</strong>
                <em>{s.scientificName || s.kingdom}</em>
              </button>
            </li>
          ))}
          <li>
            <button type="button" className="ghost-link" onClick={() => setCustomOpen(true)}>
              Add something that isn’t in the library
            </button>
          </li>
        </ul>
      )}

      {selectedSpecies && (
        <p className="picked">
          {selectedSpecies.commonName}
          {selectedSpecies.scientificName ? <em> · {selectedSpecies.scientificName}</em> : null}
          <button type="button" className="text-btn" onClick={() => setSpeciesId('')}>
            change
          </button>
        </p>
      )}

      {customOpen && (
        <div className="custom-box">
          <label className="field">
            <span>Common name</span>
            <input value={customName} onChange={(e) => setCustomName(e.target.value)} />
          </label>
          <label className="field">
            <span>Scientific name</span>
            <input value={customSci} onChange={(e) => setCustomSci(e.target.value)} />
          </label>
          <label className="field">
            <span>Kind</span>
            <select
              value={customKingdom}
              onChange={(e) => setCustomKingdom(e.target.value as Species['kingdom'])}
            >
              <option value="plant">Plant</option>
              <option value="bird">Bird</option>
              <option value="insect">Insect</option>
              <option value="amphibian">Amphibian</option>
              <option value="mammal">Mammal</option>
              <option value="fungus">Fungus</option>
              <option value="abiotic">Weather / ice / snow</option>
              <option value="other">Other</option>
            </select>
          </label>
          <button type="button" className="btn btn-quiet" onClick={() => void addCustom()}>
            Add to library
          </button>
        </div>
      )}

      <label className="field">
        <span>Phenophase</span>
        <select
          value={phenophase}
          onChange={(e) => setPhenophase(e.target.value as PhenophaseId)}
        >
          {phases.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Field notes</span>
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Where, how many, the weather, the feeling of the day."
        />
      </label>

      <div className="form-actions">
        <button type="submit" className="btn" disabled={!speciesId}>
          {existing ? 'Save' : 'Keep this'}
        </button>
        <button type="button" className="btn btn-quiet" onClick={closeForm}>
          Cancel
        </button>
      </div>
    </form>
  )
}
