import { useEffect } from 'react'
import { VIEWS } from '../types'
import { yearsInRange } from '../lib/calendar'
import { useStore } from '../state/store'
import { YearRing } from './YearRing'
import { Almanac } from './Almanac'
import { Log } from './Log'
import { Library } from './Library'
import { StationView } from './Station'
import { ObservationForm } from './ObservationForm'
import { SampleBanner } from './SampleBanner'
import { Specimen } from './Specimen'

export function Shell() {
  const {
    station,
    observations,
    customSpecies,
    view,
    setView,
    selectedId,
    setSelectedId,
    formOpen,
    formDate,
    openForm,
    closeForm,
    settings,
    updateSettings,
  } = useStore()

  const years = yearsInRange(observations, new Date().getFullYear())

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
      if (e.key === 'Escape') {
        closeForm()
        setSelectedId(null)
        return
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'n') {
        e.preventDefault()
        openForm()
      }
      if (e.key === '1') setView('ring')
      if (e.key === '2') setView('almanac')
      if (e.key === '3') setView('log')
      if (e.key === '4') setView('library')
      if (e.key === '5') setView('station')
      if (e.key === '/') {
        e.preventDefault()
        setView('log')
        queueMicrotask(() => {
          document.querySelector<HTMLInputElement>('input[type="search"]')?.focus()
        })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeForm, openForm, setSelectedId, setView])

  if (!station) return null

  return (
    <div className="shell">
      <aside className="spine">
        <div className="spine-brand">
          <span className="spine-mark" aria-hidden="true" />
          <span className="spine-title">Witness Tree</span>
        </div>
        <nav className="spine-nav" aria-label="Primary">
          {VIEWS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={view === item.id ? 'is-on' : ''}
              aria-current={view === item.id ? 'page' : undefined}
              onClick={() => setView(item.id)}
            >
              <span>{item.label}</span>
              <kbd>{item.hint}</kbd>
            </button>
          ))}
        </nav>
        <p className="spine-station">{station.name}</p>
      </aside>

      <div className="shell-body">
        <SampleBanner />
        <div className="shell-pages">
          <main className="stage">
        {view === 'ring' && (
          <div className="ring-stage">
            <header className="ring-toolbar">
              <div>
                <p className="kicker">{station.name}</p>
                <h1>The ring</h1>
              </div>
              <div className="year-pills" role="tablist" aria-label="Years">
                <button
                  type="button"
                  role="tab"
                  aria-selected={settings.selectedYear === 'all'}
                  className={settings.selectedYear === 'all' ? 'is-on' : ''}
                  onClick={() => void updateSettings({ selectedYear: 'all' })}
                >
                  All years
                </button>
                {years.map((y) => (
                  <button
                    key={y}
                    type="button"
                    role="tab"
                    aria-selected={settings.selectedYear === y}
                    className={settings.selectedYear === y ? 'is-on' : ''}
                    onClick={() => void updateSettings({ selectedYear: y })}
                  >
                    {y}
                  </button>
                ))}
              </div>
              <button className="btn" type="button" onClick={() => openForm()}>
                Log a first
              </button>
            </header>
            <YearRing
              observations={observations}
              customSpecies={customSpecies}
              year={settings.selectedYear}
              hemisphere={station.hemisphere}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onPickDate={(iso) => openForm(iso)}
            />
            <p className="ring-caption">
              Circles are peaks. Outward triangles are firsts. Inward triangles are lasts. Click the
              wood to date a new mark.
            </p>
          </div>
        )}
        {view === 'almanac' && <Almanac />}
        {view === 'log' && <Log />}
        {view === 'library' && <Library />}
        {view === 'station' && <StationView />}
          </main>

          <aside className="panel" aria-label="Inspector">
            {formOpen ? (
              <ObservationForm key={`${formDate ?? ''}-${selectedId ?? 'new'}`} />
            ) : (
              <Specimen />
            )}
            <p className="keys">
              <kbd>n</kbd> new · <kbd>1–5</kbd> views · <kbd>/</kbd> search · <kbd>esc</kbd> close
            </p>
          </aside>
        </div>
      </div>
    </div>
  )
}
