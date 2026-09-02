import { describe, expect, it } from 'vitest'
import { buildBackup, buildCsv, parseBackup } from './export'
import { inWindow, shiftDoy } from './ids'
import { SAMPLE_STATION, buildSampleObservations } from './sample'
import { seasonalPrompts } from './prompts'
import { SPECIES_LIBRARY } from '../data/species'

describe('export', () => {
  it('round-trips a backup file', () => {
    const backup = buildBackup(SAMPLE_STATION, [], [], { theme: 'lamp', selectedYear: 2026 })
    const parsed = parseBackup(JSON.stringify(backup))
    expect(parsed.station?.name).toBe('Blackwood Hollow')
    expect(parsed.settings.theme).toBe('lamp')
  })

  it('rejects a random JSON object', () => {
    expect(() => parseBackup(JSON.stringify({ hello: 'no' }))).toThrow(/Witness Tree/)
  })

  it('escapes commas and quotes in CSV notes', () => {
    const csv = buildCsv(
      [
        {
          id: 'abc',
          speciesId: 'lilac',
          phenophase: 'first-flower',
          date: '2026-05-10',
          notes: 'Scent, "loud", everywhere',
          createdAt: '',
          updatedAt: '',
        },
      ],
      [],
    )
    expect(csv).toContain('"Scent, ""loud"", everywhere"')
    expect(csv.split('\n')[0]).toContain('common_name')
  })
})

describe('sample ledger', () => {
  it('does not invent observations in the future', () => {
    const now = new Date(2026, 5, 1)
    const rows = buildSampleObservations(now)
    expect(rows.length).toBeGreaterThan(40)
    expect(rows.every((r) => r.date <= '2026-06-01')).toBe(true)
    expect(rows.every((r) => r.speciesId !== 'junco')).toBe(true)
  })
})

describe('windows and prompts', () => {
  it('handles ranges that wrap the year', () => {
    expect(inWindow(2, 360, 10)).toBe(true)
    expect(inWindow(200, 360, 10)).toBe(false)
  })

  it('shifts typical windows by half a year in the south', () => {
    expect(shiftDoy(80, 2026, 'S')).toBe(80 + 182)
  })

  it('offers living prompts in a northern May', () => {
    const prompts = seasonalPrompts(new Date(2026, 4, 12), 'N')
    expect(prompts.length).toBeGreaterThan(0)
    expect(SPECIES_LIBRARY.some((s) => s.id === 'lilac')).toBe(true)
  })
})
