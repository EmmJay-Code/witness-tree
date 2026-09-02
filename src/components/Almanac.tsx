import {
  dayLengthDeltaMinutes,
  moonIllumination,
  moonPhaseName,
  sunTimes,
} from '../lib/astronomy'
import {
  formatLongDate,
  formatTime,
  parseIsoDate,
  seasonAt,
  seasonLabel,
  seasonProgress,
} from '../lib/calendar'
import { phaseMeta } from '../lib/phenophases'
import { seasonalPrompts } from '../lib/prompts'
import { speciesById } from '../lib/ids'
import { formatCoords } from '../data/places'
import { useStore } from '../state/store'
import { Moon } from './Moon'

export function Almanac() {
  const { station, observations, customSpecies } = useStore()
  if (!station) return null

  const now = new Date()
  const sun = sunTimes(now, station.lat, station.lon)
  const delta = dayLengthDeltaMinutes(now, station.lat, station.lon)
  const season = seasonAt(now, station.hemisphere)
  const progress = seasonProgress(now, station.hemisphere)
  const prompts = seasonalPrompts(now, station.hemisphere, customSpecies, 5)
  const illum = Math.round(moonIllumination(now) * 100)

  const onThisDay = observations.filter((o) => {
    const d = parseIsoDate(o.date)
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() !== now.getFullYear()
  })

  const deltaLabel =
    Math.abs(delta) < 0.4
      ? 'Day length is holding still.'
      : delta > 0
        ? `The day has grown ${Math.abs(delta).toFixed(1)} minutes since yesterday.`
        : `The day has thinned ${Math.abs(delta).toFixed(1)} minutes since yesterday.`

  return (
    <div className="almanac">
      <p className="kicker">Station almanac</p>
      <h2>{formatLongDate(now, station.timezone)}</h2>
      <p className="lede">
        {seasonLabel(season)} at {station.name}. {Math.round(progress * 100)}% of the way through the
        season. {formatCoords(station.lat, station.lon)}
      </p>

      <div className="season-meter" aria-hidden="true">
        <span style={{ width: `${progress * 100}%` }} />
      </div>

      <div className="almanac-grid">
        <article className="stat-card">
          <p className="kicker">Sun</p>
          {sun.event === 'polar-day' && <p className="stat">The sun does not set.</p>}
          {sun.event === 'polar-night' && <p className="stat">The sun does not rise.</p>}
          {sun.event === 'normal' && sun.sunrise && sun.sunset && (
            <p className="stat">
              {formatTime(sun.sunrise, station.timezone)}
              <span> to </span>
              {formatTime(sun.sunset, station.timezone)}
            </p>
          )}
          <p className="muted">{deltaLabel}</p>
        </article>

        <article className="stat-card moon-card">
          <p className="kicker">Moon</p>
          <div className="moon-row">
            <Moon date={now} />
            <div>
              <p className="stat">{moonPhaseName(now)}</p>
              <p className="muted">{illum}% illuminated</p>
            </div>
          </div>
        </article>
      </div>

      <section>
        <p className="kicker">Have you seen</p>
        <ul className="prompt-list">
          {prompts.length === 0 && (
            <li className="muted">Nothing in the typical windows today. The world is still allowed to surprise you.</li>
          )}
          {prompts.map((p) => (
            <li key={`${p.species.id}-${p.phase.phase}`}>
              <strong>{p.species.commonName}</strong>
              <span>
                {phaseMeta(p.phase.phase).label}
                {p.kind === 'closing' ? ' — window closing' : ''}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {onThisDay.length > 0 && (
        <section>
          <p className="kicker">On this day</p>
          <ul className="prompt-list">
            {onThisDay.map((o) => {
              const sp = speciesById(customSpecies, o.speciesId)
              return (
                <li key={o.id}>
                  <strong>{sp?.commonName ?? o.speciesId}</strong>
                  <span>
                    {parseIsoDate(o.date).getFullYear()} · {phaseMeta(o.phenophase).label}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
