import type { Kingdom, MarkerKind, PhenophaseId } from '../types'

export interface PhaseMeta {
  id: PhenophaseId
  label: string
  marker: MarkerKind
  kingdoms: Kingdom[] | 'all'
}

export const PHENOPHASES: PhaseMeta[] = [
  { id: 'first-leaf', label: 'First leaf', marker: 'first', kingdoms: ['plant'] },
  { id: 'first-flower', label: 'First flower', marker: 'first', kingdoms: ['plant'] },
  { id: 'full-flower', label: 'Full flower', marker: 'peak', kingdoms: ['plant'] },
  { id: 'first-fruit', label: 'First fruit', marker: 'first', kingdoms: ['plant'] },
  { id: 'ripe-fruit', label: 'Ripe fruit', marker: 'peak', kingdoms: ['plant'] },
  { id: 'color-change', label: 'Color change', marker: 'peak', kingdoms: ['plant'] },
  { id: 'leaf-fall', label: 'Leaf fall', marker: 'last', kingdoms: ['plant'] },
  { id: 'first-seen', label: 'First seen', marker: 'first', kingdoms: ['bird', 'insect', 'amphibian', 'mammal', 'fungus', 'other'] },
  { id: 'last-seen', label: 'Last seen', marker: 'last', kingdoms: ['bird', 'insect', 'amphibian', 'mammal', 'fungus', 'other'] },
  { id: 'peak-activity', label: 'Peak activity', marker: 'peak', kingdoms: ['bird', 'insect', 'amphibian', 'mammal', 'fungus', 'other'] },
  { id: 'calling', label: 'Calling', marker: 'peak', kingdoms: ['bird', 'amphibian', 'insect'] },
  { id: 'nesting', label: 'Nesting', marker: 'peak', kingdoms: ['bird'] },
  { id: 'arrival', label: 'Arrival', marker: 'first', kingdoms: ['bird', 'insect'] },
  { id: 'departure', label: 'Departure', marker: 'last', kingdoms: ['bird', 'insect'] },
  { id: 'first-frost', label: 'First frost', marker: 'first', kingdoms: ['abiotic'] },
  { id: 'last-frost', label: 'Last frost', marker: 'last', kingdoms: ['abiotic'] },
  { id: 'ice-on', label: 'Ice on', marker: 'first', kingdoms: ['abiotic'] },
  { id: 'ice-off', label: 'Ice off', marker: 'last', kingdoms: ['abiotic'] },
  { id: 'snow-on', label: 'First snow', marker: 'first', kingdoms: ['abiotic'] },
  { id: 'snow-off', label: 'Snow gone', marker: 'last', kingdoms: ['abiotic'] },
  { id: 'other', label: 'Other', marker: 'peak', kingdoms: 'all' },
]

const byId = new Map(PHENOPHASES.map((p) => [p.id, p]))

export function phaseMeta(id: PhenophaseId): PhaseMeta {
  return byId.get(id) ?? PHENOPHASES[PHENOPHASES.length - 1]
}

export function phasesForKingdom(kingdom: Kingdom): PhaseMeta[] {
  return PHENOPHASES.filter((p) => p.kingdoms === 'all' || p.kingdoms.includes(kingdom))
}

export const KINGDOM_META: Record<
  Kingdom,
  { label: string; plural: string; color: string }
> = {
  plant: { label: 'Plant', plural: 'Plants', color: 'var(--moss)' },
  bird: { label: 'Bird', plural: 'Birds', color: 'var(--sky)' },
  insect: { label: 'Insect', plural: 'Insects', color: 'var(--amber)' },
  amphibian: { label: 'Amphibian', plural: 'Amphibians', color: 'var(--lichen)' },
  mammal: { label: 'Mammal', plural: 'Mammals', color: 'var(--rust)' },
  fungus: { label: 'Fungus', plural: 'Fungi', color: 'var(--petal)' },
  abiotic: { label: 'Weather', plural: 'Weather', color: 'var(--slate)' },
  other: { label: 'Other', plural: 'Other', color: 'var(--ink-soft)' },
}

export function kingdomLabel(k: Kingdom): string {
  return KINGDOM_META[k].label
}
