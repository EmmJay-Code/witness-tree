import type { Hemisphere } from '../types'
import { solarLongitude } from './astronomy'

export const SEASONS = ['winter', 'spring', 'summer', 'autumn'] as const
export type Season = (typeof SEASONS)[number]

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

export function daysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365
}

export function dayOfYear(date: Date): number {
  const start = Date.UTC(date.getFullYear(), 0, 1)
  const current = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.floor((current - start) / 86_400_000) + 1
}

export function dateFromDayOfYear(year: number, doy: number): Date {
  return new Date(year, 0, doy)
}

export function isoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(date.getDate() + days)
  return next
}

export function seasonFromLongitude(lon: number, hemisphere: Hemisphere): Season {
  const northern: Season =
    lon < 90 ? 'spring' : lon < 180 ? 'summer' : lon < 270 ? 'autumn' : 'winter'
  if (hemisphere === 'N') return northern
  switch (northern) {
    case 'spring':
      return 'autumn'
    case 'summer':
      return 'winter'
    case 'autumn':
      return 'spring'
    case 'winter':
      return 'summer'
  }
}

export function seasonAt(date: Date, hemisphere: Hemisphere): Season {
  return seasonFromLongitude(solarLongitude(date), hemisphere)
}

export interface CardinalDates {
  spring: Date
  summer: Date
  autumn: Date
  winter: Date
}

/** Astronomical equinoxes and solstices for a calendar year, local-date precision. */
export function cardinalDates(year: number): CardinalDates {
  const found: Partial<Record<0 | 90 | 180 | 270, Date>> = {}
  let prev = solarLongitude(new Date(year, 0, 1, 12))
  for (let doy = 2; doy <= daysInYear(year); doy++) {
    const date = new Date(year, 0, doy, 12)
    const lon = solarLongitude(date)
    const gates: Array<0 | 90 | 180 | 270> = [0, 90, 180, 270]
    for (const gate of gates) {
      if (found[gate]) continue
      const crossed =
        gate === 0
          ? prev > 300 && lon < 60
          : prev < gate && lon >= gate
      if (crossed) found[gate] = date
    }
    prev = lon
  }
  return {
    spring: found[0] ?? new Date(year, 2, 20),
    summer: found[90] ?? new Date(year, 5, 21),
    autumn: found[180] ?? new Date(year, 8, 22),
    winter: found[270] ?? new Date(year, 11, 21),
  }
}

export function seasonProgress(date: Date, hemisphere: Hemisphere): number {
  const lon = solarLongitude(date)
  const northernStart = lon < 90 ? 0 : lon < 180 ? 90 : lon < 270 ? 180 : 270
  const start = hemisphere === 'N' ? northernStart : (northernStart + 180) % 360
  const offset = wrap360(lon - start)
  return Math.min(1, Math.max(0, offset / 90))
}

function wrap360(d: number): number {
  return ((d % 360) + 360) % 360
}

export function formatLongDate(date: Date, timeZone?: string): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone,
  })
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatTime(date: Date, timeZone: string): string {
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  })
}

export function monthLabels(): string[] {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
}

export function monthStartDoy(year: number, monthIndex: number): number {
  return dayOfYear(new Date(year, monthIndex, 1))
}

export function yearsInRange(observations: { date: string }[], extraYear?: number): number[] {
  const set = new Set<number>()
  for (const o of observations) set.add(parseIsoDate(o.date).getFullYear())
  if (extraYear !== undefined) set.add(extraYear)
  return [...set].sort((a, b) => a - b)
}

export function clampYearDoy(year: number, doy: number): number {
  return Math.min(daysInYear(year), Math.max(1, Math.round(doy)))
}

export function seasonLabel(season: Season): string {
  return season.charAt(0).toUpperCase() + season.slice(1)
}
