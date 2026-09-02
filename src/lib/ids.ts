import type { Species } from '../types'
import { SPECIES_LIBRARY } from '../data/species'
import { daysInYear, isoDate, parseIsoDate } from './calendar'

export function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function allSpecies(custom: Species[]): Species[] {
  const ids = new Set(custom.map((s) => s.id))
  return [...SPECIES_LIBRARY.filter((s) => !ids.has(s.id)), ...custom]
}

export function speciesById(custom: Species[], id: string): Species | undefined {
  return allSpecies(custom).find((s) => s.id === id)
}

/** Shift a northern day-of-year window for southern-hemisphere stations. */
export function shiftDoy(doy: number, year: number, hemisphere: 'N' | 'S'): number {
  if (hemisphere === 'N') return ((doy - 1) % daysInYear(year)) + 1
  const dim = daysInYear(year)
  return ((doy - 1 + Math.floor(dim / 2)) % dim) + 1
}

export function inWindow(doy: number, start: number, end: number): boolean {
  if (start <= end) return doy >= start && doy <= end
  return doy >= start || doy <= end
}

export function hashString(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function jitterDays(seed: string, spread: number): number {
  if (spread <= 0) return 0
  const h = hashString(seed)
  return (h % (spread * 2 + 1)) - spread
}

export function withJitter(iso: string, seed: string, spread: number): string {
  const date = parseIsoDate(iso)
  date.setDate(date.getDate() + jitterDays(seed, spread))
  return isoDate(date)
}
