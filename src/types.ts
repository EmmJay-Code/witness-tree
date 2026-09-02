export const KINGDOMS = [
  'plant',
  'bird',
  'insect',
  'amphibian',
  'mammal',
  'fungus',
  'abiotic',
  'other',
] as const

export type Kingdom = (typeof KINGDOMS)[number]

export const PHENOPHASE_IDS = [
  'first-leaf',
  'first-flower',
  'full-flower',
  'first-fruit',
  'ripe-fruit',
  'color-change',
  'leaf-fall',
  'first-seen',
  'last-seen',
  'peak-activity',
  'calling',
  'nesting',
  'arrival',
  'departure',
  'first-frost',
  'last-frost',
  'ice-on',
  'ice-off',
  'snow-on',
  'snow-off',
  'other',
] as const

export type PhenophaseId = (typeof PHENOPHASE_IDS)[number]

export type MarkerKind = 'first' | 'peak' | 'last'

export type View = 'ring' | 'almanac' | 'log' | 'library' | 'station'

export type Theme = 'paper' | 'lamp'

export type Hemisphere = 'N' | 'S'

export interface TypicalWindow {
  phase: PhenophaseId
  startDoy: number
  endDoy: number
}

export interface Species {
  id: string
  commonName: string
  scientificName: string
  kingdom: Kingdom
  notes: string
  typical: TypicalWindow[]
  custom?: boolean
}

export interface Observation {
  id: string
  speciesId: string
  phenophase: PhenophaseId
  date: string
  notes: string
  lat?: number
  lon?: number
  createdAt: string
  updatedAt: string
}

export interface Station {
  name: string
  observer: string
  lat: number
  lon: number
  timezone: string
  hemisphere: Hemisphere
  established: string
  bio: string
  /** True only for the canned sample hollow — never inferred from a name the keeper typed. */
  sample?: boolean
}

export interface Settings {
  theme: Theme
  selectedYear: number | 'all'
}

export interface BackupFile {
  version: 1
  exportedAt: string
  station: Station | null
  observations: Observation[]
  customSpecies: Species[]
  settings: Settings
}

export const VIEWS: { id: View; label: string; hint: string }[] = [
  { id: 'ring', label: 'Ring', hint: '1' },
  { id: 'almanac', label: 'Almanac', hint: '2' },
  { id: 'log', label: 'Log', hint: '3' },
  { id: 'library', label: 'Library', hint: '4' },
  { id: 'station', label: 'Station', hint: '5' },
]
