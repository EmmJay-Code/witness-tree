import { useState } from 'react'
import { hemisphereFromLat, PLACES, formatCoords } from '../data/places'
import { isoDate } from '../lib/calendar'
import { isSampleStation } from '../lib/sample'
import { useStore } from '../state/store'
import type { Station } from '../types'

export function Onboarding() {
  const { station, saveStation, loadSample, openSample, openBook, beginOwnStation } = useStore()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [observer, setObserver] = useState('')
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [placeName, setPlaceName] = useState<string | null>(null)
  const [geoError, setGeoError] = useState('')
  const [confirmNew, setConfirmNew] = useState(false)
  const [confirmSample, setConfirmSample] = useState(false)

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const parsedLat = Number(lat)
  const parsedLon = Number(lon)
  const coordsOk = Number.isFinite(parsedLat) && Number.isFinite(parsedLon) && lat !== '' && lon !== ''
  const sample = isSampleStation(station)
  const hasBook = Boolean(station)

  function applyPlace(place: (typeof PLACES)[number]) {
    setLat(String(place.lat))
    setLon(String(place.lon))
    setPlaceName(place.name)
    setGeoError('')
    if (!name) setName(place.name)
  }

  function locate() {
    setGeoError('')
    if (!navigator.geolocation) {
      setGeoError('This browser will not give a location. Choose a place below.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(4))
        setLon(pos.coords.longitude.toFixed(4))
        setPlaceName('Here')
      },
      () => setGeoError('Location was refused. Choose a place, or type coordinates.'),
    )
  }

  function startEstablish() {
    if (hasBook) {
      setConfirmNew(true)
      setConfirmSample(false)
      return
    }
    setStep(1)
  }

  async function walkSample() {
    if (sample) {
      openBook()
      return
    }
    if (hasBook) {
      setConfirmSample(true)
      setConfirmNew(false)
      return
    }
    await openSample()
  }

  async function found() {
    if (!coordsOk) return
    const next: Station = {
      name: name.trim() || placeName || 'Untitled station',
      observer: observer.trim() || 'Anonymous keeper',
      lat: parsedLat,
      lon: parsedLon,
      timezone: tz,
      hemisphere: hemisphereFromLat(parsedLat),
      established: isoDate(new Date()),
      bio: '',
      sample: false,
    }
    if (hasBook) await beginOwnStation(next)
    else await saveStation(next)
  }

  return (
    <div className="onboard">
      <div className="onboard-mark" aria-hidden="true">
        <svg viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="60" cy="60" r="38" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="60" cy="60" r="22" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="82" cy="34" r="4" fill="currentColor" />
        </svg>
      </div>

      {step === 0 && (
        <section className="onboard-card">
          <p className="kicker">Witness Tree</p>
          <h1>Keep a ring for every year you watched the living world.</h1>
          <p className="lede">
            A witness tree is a living survey mark — a tree that holds a line on the land. This is a
            phenology journal: first bloom, first chorus, first frost, plotted as growth rings.
          </p>
          <p>
            Nothing leaves this device. There is no account. You are the keeper of a station, even if
            the station is a balcony.
          </p>
          {sample && (
            <p className="muted">The sample hollow is still open. You can return to it anytime.</p>
          )}
          <div className="form-actions">
            {hasBook && (
              <button className="btn" type="button" onClick={openBook}>
                Return to {station?.name}
              </button>
            )}
            <button
              className={hasBook ? 'btn btn-quiet' : 'btn'}
              type="button"
              onClick={startEstablish}
            >
              Establish a station
            </button>
            <button className="btn btn-quiet" type="button" onClick={() => void walkSample()}>
              {sample ? 'Continue the sample' : 'Walk a sample year'}
            </button>
          </div>
          {confirmNew && (
            <div className="home-confirm">
              <p>
                {sample
                  ? 'Starting your own station puts the sample away and opens a blank book. The sample can be loaded again later.'
                  : 'This replaces your current station and records with a new blank book.'}
              </p>
              <div className="form-actions">
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    setConfirmNew(false)
                    setStep(1)
                  }}
                >
                  Continue
                </button>
                <button className="btn btn-quiet" type="button" onClick={() => setConfirmNew(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
          {confirmSample && (
            <div className="home-confirm">
              <p>Loading the sample replaces your current station and records.</p>
              <div className="form-actions">
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    setConfirmSample(false)
                    void loadSample()
                  }}
                >
                  Load the sample
                </button>
                <button
                  className="btn btn-quiet"
                  type="button"
                  onClick={() => setConfirmSample(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {step === 1 && (
        <section className="onboard-card">
          <p className="kicker">Where</p>
          <h1>Name the ground you will watch.</h1>
          <p className="lede">
            Sun times, seasons, and the almanac all hang on a point. Approximate is enough.
          </p>

          <label className="field">
            <span>Station name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Blackwood Hollow, the fire escape, the allotment…"
            />
          </label>
          <label className="field">
            <span>Your name</span>
            <input
              value={observer}
              onChange={(e) => setObserver(e.target.value)}
              placeholder="Optional"
            />
          </label>

          <div className="coord-row">
            <label className="field">
              <span>Latitude</span>
              <input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="42.36" />
            </label>
            <label className="field">
              <span>Longitude</span>
              <input value={lon} onChange={(e) => setLon(e.target.value)} placeholder="-71.06" />
            </label>
          </div>

          <button type="button" className="btn btn-quiet" onClick={locate}>
            Use this device’s location
          </button>
          {geoError && <p className="flash">{geoError}</p>}
          {coordsOk && (
            <p className="muted">
              {formatCoords(parsedLat, parsedLon)} · {hemisphereFromLat(parsedLat) === 'S' ? 'Southern' : 'Northern'}{' '}
              hemisphere · {tz}
            </p>
          )}

          <p className="kicker" style={{ marginTop: '1.5rem' }}>
            Or pick a climate
          </p>
          <ul className="place-grid">
            {PLACES.map((place) => (
              <li key={place.name}>
                <button
                  type="button"
                  className={`place ${placeName === place.name ? 'is-on' : ''}`}
                  onClick={() => applyPlace(place)}
                >
                  <strong>{place.name}</strong>
                  <span>{place.region}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="form-actions">
            <button className="btn" type="button" disabled={!coordsOk} onClick={() => void found()}>
              Open the book
            </button>
            <button className="btn btn-quiet" type="button" onClick={() => setStep(0)}>
              Back
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
