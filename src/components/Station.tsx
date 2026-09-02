import { useEffect, useRef, useState, type FormEvent } from 'react'
import { hemisphereFromLat, formatCoords } from '../data/places'
import { buildCsv, buildBackup, downloadText, parseBackup } from '../lib/export'
import { isoDate } from '../lib/calendar'
import { isSampleStation } from '../lib/sample'
import { useStore } from '../state/store'

export function StationView() {
  const {
    station,
    observations,
    customSpecies,
    settings,
    saveStation,
    updateSettings,
    restore,
    loadSample,
    resetAll,
  } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState('')
  const [confirmWipe, setConfirmWipe] = useState(false)
  const [confirmSample, setConfirmSample] = useState(false)
  const [name, setName] = useState(station?.name ?? '')
  const [observer, setObserver] = useState(station?.observer ?? '')
  const [bio, setBio] = useState(station?.bio ?? '')
  const [lat, setLat] = useState(station ? String(station.lat) : '')
  const [lon, setLon] = useState(station ? String(station.lon) : '')
  const [timezone, setTimezone] = useState(station?.timezone ?? '')

  useEffect(() => {
    if (!station) return
    setName(station.name)
    setObserver(station.observer)
    setBio(station.bio)
    setLat(String(station.lat))
    setLon(String(station.lon))
    setTimezone(station.timezone)
  }, [station])

  if (!station) return null

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!station) return
    const current = station
    const nextLat = Number(lat)
    const nextLon = Number(lon)
    if (Number.isNaN(nextLat) || Number.isNaN(nextLon)) return
    await saveStation({
      ...current,
      name: name.trim() || current.name,
      observer: observer.trim(),
      bio,
      lat: nextLat,
      lon: nextLon,
      timezone,
      hemisphere: hemisphereFromLat(nextLat),
    })
    setBusy('Station saved.')
  }

  function exportJson() {
    const backup = buildBackup(station, observations, customSpecies, settings)
    downloadText(
      `witness-tree-${isoDate(new Date())}.json`,
      JSON.stringify(backup, null, 2),
      'application/json',
    )
  }

  function exportCsv() {
    downloadText(
      `witness-tree-${isoDate(new Date())}.csv`,
      buildCsv(observations, customSpecies),
      'text/csv',
    )
  }

  async function onImport(file: File) {
    const text = await file.text()
    const backup = parseBackup(text)
    await restore(backup.station, backup.observations, backup.customSpecies, backup.settings)
    setBusy(`Restored ${backup.observations.length} records.`)
  }

  const timeZones =
    typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl
      ? Intl.supportedValuesOf('timeZone')
      : [timezone]

  const sample = isSampleStation(station)

  return (
    <div className="station">
      <p className="kicker">Your station</p>
      <h2>{station.name}</h2>
      <p className="lede">
        Established {station.established}. {formatCoords(station.lat, station.lon)}. {observations.length}{' '}
        observations on the ring.
      </p>

      <form className="form-grid" onSubmit={(e) => void save(e)}>
        <label className="field">
          <span>Station name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field">
          <span>Observer</span>
          <input value={observer} onChange={(e) => setObserver(e.target.value)} />
        </label>
        <label className="field">
          <span>Latitude</span>
          <input value={lat} onChange={(e) => setLat(e.target.value)} />
        </label>
        <label className="field">
          <span>Longitude</span>
          <input value={lon} onChange={(e) => setLon(e.target.value)} />
        </label>
        <label className="field field-wide">
          <span>Timezone</span>
          <select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
            {timeZones.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </label>
        <label className="field field-wide">
          <span>About this place</span>
          <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
        </label>
        <div className="form-actions field-wide">
          <button className="btn" type="submit">
            Save station
          </button>
        </div>
      </form>

      <section className="station-block">
        <p className="kicker">Lamp</p>
        <p>Paper is for daylight. Lamp is for the desk at night.</p>
        <div className="choice-row">
          <button
            type="button"
            className={`chip ${settings.theme === 'paper' ? 'is-on' : ''}`}
            onClick={() => void updateSettings({ theme: 'paper' })}
          >
            Paper
          </button>
          <button
            type="button"
            className={`chip ${settings.theme === 'lamp' ? 'is-on' : ''}`}
            onClick={() => void updateSettings({ theme: 'lamp' })}
          >
            Lamp
          </button>
        </div>
      </section>

      <section className="station-block">
        <p className="kicker">Take it with you</p>
        <p>
          Everything lives in this browser. Export a backup before you clear site data. The CSV is a
          plain table you can open in a spreadsheet or send to a scientist.
        </p>
        <div className="choice-row">
          <button type="button" className="btn" onClick={exportJson}>
            Backup JSON
          </button>
          <button type="button" className="btn btn-quiet" onClick={exportCsv}>
            Export CSV
          </button>
          <button type="button" className="btn btn-quiet" onClick={() => fileRef.current?.click()}>
            Restore backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void onImport(file)
              e.target.value = ''
            }}
          />
        </div>
      </section>

      <section className="station-block">
        <p className="kicker">Sample hollow</p>
        {sample ? (
          <>
            <p>
              This station is the canned walk-through. Starting your own book clears these invented
              records. Your real ledger is never behind this button — only the sample is.
            </p>
            {!confirmSample ? (
              <button type="button" className="btn" onClick={() => setConfirmSample(true)}>
                Start your own station
              </button>
            ) : (
              <div className="choice-row">
                <button type="button" className="btn" onClick={() => void resetAll()}>
                  Yes, clear the sample
                </button>
                <button type="button" className="btn btn-quiet" onClick={() => setConfirmSample(false)}>
                  Stay here
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <p>
              Load three years of invented New England phenology — a way to walk the ring before your
              own year has marks. This replaces the current ledger.
            </p>
            {!confirmSample ? (
              <button type="button" className="btn btn-quiet" onClick={() => setConfirmSample(true)}>
                Load Blackwood Hollow
              </button>
            ) : (
              <div className="choice-row">
                <button type="button" className="btn" onClick={() => void loadSample()}>
                  Replace my records with the sample
                </button>
                <button type="button" className="btn btn-quiet" onClick={() => setConfirmSample(false)}>
                  Keep my station
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <section className="station-block">
        <p className="kicker">About</p>
        <p>
          A witness tree is a living survey monument: a tree that holds a line on the land. This
          journal asks you to be one — to notice the first frost, the last swallow, the day the maples
          turned, and to keep those days as rings.
        </p>
        <p>
          Phenology is the timing of life. Citizen keepers have used it to watch climate move under
          their feet. Witness Tree is not affiliated with any network; it just keeps a careful book.
        </p>
        <p className="muted">
          Sun and moon times are computed here from the station coordinates. No account. No server.
          No telemetry.
        </p>
      </section>

      <section className="station-block">
        <p className="kicker">Close the book</p>
        {!confirmWipe ? (
          <button type="button" className="text-btn danger" onClick={() => setConfirmWipe(true)}>
            Erase this station and all records
          </button>
        ) : (
          <div className="choice-row">
            <button
              type="button"
              className="btn"
              onClick={() => void resetAll()}
            >
              Yes, erase everything
            </button>
            <button type="button" className="btn btn-quiet" onClick={() => setConfirmWipe(false)}>
              Keep it
            </button>
          </div>
        )}
      </section>

      {busy && <p className="flash">{busy}</p>}
    </div>
  )
}
