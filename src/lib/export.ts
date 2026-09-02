import type { BackupFile, Observation, Species, Station } from '../types'
import { speciesById } from './ids'
import { phaseMeta } from './phenophases'

export function buildBackup(
  station: Station | null,
  observations: Observation[],
  customSpecies: Species[],
  settings: BackupFile['settings'],
): BackupFile {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    station,
    observations,
    customSpecies,
    settings,
  }
}

export function parseBackup(raw: string): BackupFile {
  const data = JSON.parse(raw) as BackupFile
  if (data.version !== 1 || !Array.isArray(data.observations)) {
    throw new Error('This file is not a Witness Tree backup.')
  }
  return {
    version: 1,
    exportedAt: data.exportedAt ?? new Date().toISOString(),
    station: data.station ?? null,
    observations: data.observations,
    customSpecies: data.customSpecies ?? [],
    settings: data.settings ?? { theme: 'paper', selectedYear: 'all' },
  }
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`
  return value
}

export function buildCsv(observations: Observation[], customSpecies: Species[]): string {
  const header = [
    'date',
    'common_name',
    'scientific_name',
    'kingdom',
    'phenophase',
    'notes',
    'latitude',
    'longitude',
    'id',
  ]
  const lines = [header.join(',')]
  const sorted = [...observations].sort((a, b) => a.date.localeCompare(b.date))
  for (const obs of sorted) {
    const sp = speciesById(customSpecies, obs.speciesId)
    const row = [
      obs.date,
      csvEscape(sp?.commonName ?? obs.speciesId),
      csvEscape(sp?.scientificName ?? ''),
      sp?.kingdom ?? '',
      phaseMeta(obs.phenophase).label,
      csvEscape(obs.notes),
      obs.lat !== undefined ? String(obs.lat) : '',
      obs.lon !== undefined ? String(obs.lon) : '',
      obs.id,
    ]
    lines.push(row.join(','))
  }
  return lines.join('\n') + '\n'
}

export function downloadText(filename: string, contents: string, mime: string): void {
  const blob = new Blob([contents], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
