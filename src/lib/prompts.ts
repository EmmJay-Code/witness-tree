import type { Hemisphere, Species } from '../types'
import { SPECIES_LIBRARY } from '../data/species'
import { dayOfYear, daysInYear } from './calendar'
import { inWindow, shiftDoy } from './ids'

export interface Prompt {
  species: Species
  phase: Species['typical'][number]
  kind: 'open' | 'closing'
}

export function seasonalPrompts(
  date: Date,
  hemisphere: Hemisphere,
  extra: Species[] = [],
  limit = 4,
): Prompt[] {
  const year = date.getFullYear()
  const doy = dayOfYear(date)
  const dim = daysInYear(year)
  const library = [...SPECIES_LIBRARY, ...extra]
  const open: Prompt[] = []
  const closing: Prompt[] = []

  for (const species of library) {
    for (const phase of species.typical) {
      const start = shiftDoy(phase.startDoy, year, hemisphere)
      const end = shiftDoy(phase.endDoy, year, hemisphere)
      if (!inWindow(doy, start, end)) continue
      const span = start <= end ? end - start : dim - start + end
      const elapsed = start <= end ? doy - start : doy >= start ? doy - start : dim - start + doy
      const ratio = span === 0 ? 1 : elapsed / span
      const prompt: Prompt = { species, phase, kind: ratio > 0.7 ? 'closing' : 'open' }
      if (prompt.kind === 'closing') closing.push(prompt)
      else open.push(prompt)
    }
  }

  const pick = [...open, ...closing]
  return pick.slice(0, limit)
}

export function compareYears(
  observations: { date: string; speciesId: string; phenophase: string }[],
  speciesId: string,
  phenophase: string,
): { year: number; date: string; doy: number }[] {
  const rows = observations
    .filter((o) => o.speciesId === speciesId && o.phenophase === phenophase)
    .map((o) => {
      const date = new Date(`${o.date}T12:00:00`)
      return { year: date.getFullYear(), date: o.date, doy: dayOfYear(date) }
    })
    .sort((a, b) => a.year - b.year)
  return rows
}
