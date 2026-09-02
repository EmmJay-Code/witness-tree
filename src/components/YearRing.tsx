import { useState } from 'react'
import type { Hemisphere, Observation, Species } from '../types'
import {
  cardinalDates,
  dateFromDayOfYear,
  dayOfYear,
  daysInYear,
  isoDate,
  monthLabels,
  parseIsoDate,
  seasonAt,
} from '../lib/calendar'
import { KINGDOM_META, phaseMeta } from '../lib/phenophases'
import { arcPath, dayToAngle, pointerToDay, polar, stackOffset } from '../lib/ring'
import { speciesById } from '../lib/ids'

const CX = 500
const CY = 500
const INNER = 132
const OUTER = 428

interface Props {
  observations: Observation[]
  customSpecies: Species[]
  year: number | 'all'
  hemisphere: Hemisphere
  selectedId: string | null
  onSelect: (id: string) => void
  onPickDate: (iso: string) => void
}

export function YearRing({
  observations,
  customSpecies,
  year,
  hemisphere,
  selectedId,
  onSelect,
  onPickDate,
}: Props) {
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null)
  const now = new Date()
  const focusYear = year === 'all' ? now.getFullYear() : year
  const dim = daysInYear(focusYear)

  const years = (() => {
    const set = new Set<number>()
    for (const o of observations) set.add(parseIsoDate(o.date).getFullYear())
    set.add(focusYear)
    return [...set].sort((a, b) => a - b)
  })()

  const visibleYears = year === 'all' ? years : [year]
  const ringCount = Math.max(1, visibleYears.length)
  const ringSpan = (OUTER - INNER) / ringCount

  const seasons = (() => {
    const cards = cardinalDates(focusYear)
    const winterDoy = dayOfYear(cards.winter)
    const springDoy = dayOfYear(cards.spring)
    const summerDoy = dayOfYear(cards.summer)
    const autumnDoy = dayOfYear(cards.autumn)
    const winterSeason = seasonAt(dateFromDayOfYear(focusYear, Math.min(dim, winterDoy + 5)), hemisphere)
    const springSeason = seasonAt(dateFromDayOfYear(focusYear, Math.min(dim, springDoy + 5)), hemisphere)
    const summerSeason = seasonAt(dateFromDayOfYear(focusYear, Math.min(dim, summerDoy + 5)), hemisphere)
    const autumnSeason = seasonAt(dateFromDayOfYear(focusYear, Math.min(dim, autumnDoy + 5)), hemisphere)
    return [
      { start: winterDoy, end: springDoy, season: winterSeason },
      { start: springDoy, end: summerDoy, season: springSeason },
      { start: summerDoy, end: autumnDoy, season: summerSeason },
      { start: autumnDoy, end: winterDoy, season: autumnSeason },
    ]
  })()

  const todayDoy = now.getFullYear() === focusYear ? dayOfYear(now) : null
  const todayAngle = todayDoy ? dayToAngle(todayDoy, dim) : null
  const todayOuter = polar(CX, CY, OUTER + 18, todayAngle ?? 0)
  const todayInner = polar(CX, CY, INNER - 18, todayAngle ?? 0)

  function radiusForYear(y: number): number {
    const i = visibleYears.indexOf(y)
    const index = i === -1 ? visibleYears.length - 1 : i
    return INNER + ringSpan * (index + 0.5)
  }

  const hoverObs = hover ? observations.find((o) => o.id === hover.id) : undefined
  const hoverSpecies = hoverObs ? speciesById(customSpecies, hoverObs.speciesId) : undefined

  const stackIndex = (() => {
    const groups = new Map<string, string[]>()
    for (const obs of observations) {
      const date = parseIsoDate(obs.date)
      const y = date.getFullYear()
      if (!visibleYears.includes(y)) continue
      const key = `${y}-${dayOfYear(date)}`
      const list = groups.get(key)
      if (list) list.push(obs.id)
      else groups.set(key, [obs.id])
    }
    const index = new Map<string, { i: number; n: number }>()
    for (const ids of groups.values()) {
      ids.forEach((id, i) => index.set(id, { i, n: ids.length }))
    }
    return index
  })()

  const dense = year === 'all' && observations.length > 48
  const markSize = dense ? 5 : 7

  return (
    <div className="ring-wrap">
      <svg
        className="ring-svg"
        viewBox="0 0 1000 1000"
        role="img"
        aria-label="Year ring of phenology observations"
        onClick={(e) => {
          const target = e.target as SVGElement
          if (target.closest('[data-obs]')) return
          const hit = pointerToDay(e.clientX, e.clientY, e.currentTarget, CX, CY, dim)
          if (!hit) return
          if (hit.dist < INNER - 10 || hit.dist > OUTER + 36) return
          onPickDate(isoDate(dateFromDayOfYear(focusYear, hit.doy)))
        }}
      >
        <defs>
          <radialGradient id="disk" cx="50%" cy="46%" r="62%">
            <stop offset="0%" stopColor="var(--paper-lift)" />
            <stop offset="70%" stopColor="var(--paper)" />
            <stop offset="100%" stopColor="var(--paper-shade)" />
          </radialGradient>
        </defs>

        <circle cx={CX} cy={CY} r={OUTER + 36} fill="url(#disk)" />

        {seasons.map((s) => (
          <path
            key={`${s.season}-${s.start}`}
            className={`season-arc season-${s.season}`}
            d={arcPath(CX, CY, (INNER + OUTER) / 2, s.start, s.end, dim)}
            fill="none"
            strokeWidth={OUTER - INNER + 24}
            strokeLinecap="butt"
          />
        ))}

        {visibleYears.map((y) => (
          <circle
            key={y}
            cx={CX}
            cy={CY}
            r={radiusForYear(y)}
            fill="none"
            className="growth-ring"
            strokeWidth={y === focusYear ? 1.6 : 1}
          />
        ))}

        {monthLabels().map((label, i) => {
          const doy = dayOfYear(new Date(focusYear, i, 1))
          const a = dayToAngle(doy, dim)
          const tickIn = polar(CX, CY, OUTER + 4, a)
          const tickOut = polar(CX, CY, OUTER + 18, a)
          const textAt = polar(CX, CY, OUTER + 44, a)
          return (
            <g key={label} className="month-tick">
              <line x1={tickIn.x} y1={tickIn.y} x2={tickOut.x} y2={tickOut.y} />
              <text x={textAt.x} y={textAt.y} textAnchor="middle" dominantBaseline="middle">
                {label}
              </text>
            </g>
          )
        })}

        {todayAngle !== null && (
          <g className="today-line">
            <line x1={todayInner.x} y1={todayInner.y} x2={todayOuter.x} y2={todayOuter.y} />
            <text
              x={polar(CX, CY, OUTER + 68, todayAngle).x}
              y={polar(CX, CY, OUTER + 68, todayAngle).y}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              today
            </text>
          </g>
        )}

        {observations.map((obs) => {
          const date = parseIsoDate(obs.date)
          const y = date.getFullYear()
          if (!visibleYears.includes(y)) return null
          const doy = dayOfYear(date)
          const days = daysInYear(y)
          const angle = dayToAngle(doy, days)
          const stack = stackIndex.get(obs.id)
          const r =
            radiusForYear(y) +
            stackOffset(stack?.i ?? 0, stack?.n ?? 1, Math.min(11, ringSpan * 0.34))
          const { x, y: py } = polar(CX, CY, r, angle)
          const sp = speciesById(customSpecies, obs.speciesId)
          const color = KINGDOM_META[sp?.kingdom ?? 'other'].color
          const marker = phaseMeta(obs.phenophase).marker
          const selected = obs.id === selectedId
          return (
            <g
              key={obs.id}
              data-obs={obs.id}
              className={`obs-mark ${selected ? 'is-selected' : ''} ${dense ? 'is-dense' : ''}`}
              transform={`translate(${x} ${py})`}
              onClick={(e) => {
                e.stopPropagation()
                onSelect(obs.id)
              }}
              onPointerEnter={(e) => {
                const svg = (e.currentTarget.ownerSVGElement ?? e.currentTarget) as SVGSVGElement
                const rect = svg.getBoundingClientRect()
                setHover({
                  id: obs.id,
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
                })
              }}
              onPointerLeave={() => setHover(null)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(obs.id)
                }
              }}
              aria-label={`${sp?.commonName ?? 'Observation'} — ${phaseMeta(obs.phenophase).label} on ${obs.date}`}
            >
              <circle r="12" fill="transparent" />
              <Marker kind={marker} color={color} selected={selected} angle={angle} size={markSize} />
            </g>
          )
        })}

        <circle cx={CX} cy={CY} r={INNER - 22} className="ring-heart" />
        <text x={CX} y={CY - 12} className="ring-heart-kicker" textAnchor="middle">
          {year === 'all' ? `${visibleYears[0] ?? focusYear}–${visibleYears[visibleYears.length - 1] ?? focusYear}` : focusYear}
        </text>
        <text x={CX} y={CY + 22} className="ring-heart-title" textAnchor="middle">
          {visibleYears.length} {visibleYears.length === 1 ? 'ring' : 'rings'}
        </text>
      </svg>

      {hover && hoverObs && (
        <div
          className="ring-tooltip"
          style={{
            left: hover.x,
            top: hover.y,
            transform: hover.x > 420 ? 'translate(calc(-100% - 12px), -110%)' : undefined,
          }}
        >
          <strong>{hoverSpecies?.commonName ?? 'Unknown'}</strong>
          <span>
            {phaseMeta(hoverObs.phenophase).label} · {hoverObs.date}
          </span>
        </div>
      )}
    </div>
  )
}

function Marker({
  kind,
  color,
  selected,
  angle,
  size,
}: {
  kind: 'first' | 'peak' | 'last'
  color: string
  selected: boolean
  angle: number
  size: number
}) {
  const r = selected ? size + 3 : size
  if (kind === 'peak') {
    return <circle r={r} fill={color} className="mark-fill" />
  }
  const rad = (angle * Math.PI) / 180
  const dir = kind === 'first' ? 1 : -1
  const ox = Math.cos(rad) * dir
  const oy = Math.sin(rad) * dir
  const px = -oy
  const py = ox
  const tip = `${ox * (r + 2)},${oy * (r + 2)}`
  const a = `${-ox * r + px * r},${-oy * r + py * r}`
  const b = `${-ox * r - px * r},${-oy * r - py * r}`
  return <polygon points={`${tip} ${a} ${b}`} fill={color} className="mark-fill" />
}
