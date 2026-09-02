import type { Observation, Station } from '../types'
import { isoDate } from './calendar'
import { makeId, withJitter } from './ids'

interface SampleEvent {
  month: number
  day: number
  speciesId: string
  phenophase: Observation['phenophase']
  notes: string
  spread: number
}

const EVENTS: SampleEvent[] = [
  { month: 1, day: 18, speciesId: 'great-horned-owl', phenophase: 'calling', notes: 'Two birds calling across the hollow. Still, no wind.', spread: 6 },
  { month: 2, day: 14, speciesId: 'skunk-cabbage', phenophase: 'first-flower', notes: 'Spathe up through rotten ice at the seep.', spread: 8 },
  { month: 3, day: 8, speciesId: 'red-winged-blackbird', phenophase: 'arrival', notes: 'Males in the cattails. Ice still on the north side.', spread: 5 },
  { month: 3, day: 12, speciesId: 'wood-frog', phenophase: 'calling', notes: 'First clack from the vernal pool. Water 6°C.', spread: 6 },
  { month: 3, day: 16, speciesId: 'spring-peeper', phenophase: 'calling', notes: 'Full chorus after dusk. Could hear it from the road.', spread: 5 },
  { month: 3, day: 20, speciesId: 'american-robin', phenophase: 'arrival', notes: 'Dawn song from the sugar maple. Three birds.', spread: 7 },
  { month: 3, day: 22, speciesId: 'red-maple', phenophase: 'first-flower', notes: 'Clusters opening on the south-facing crown.', spread: 5 },
  { month: 3, day: 28, speciesId: 'mourning-cloak', phenophase: 'first-seen', notes: 'Along the stone wall, basking. One individual.', spread: 8 },
  { month: 4, day: 2, speciesId: 'ice', phenophase: 'ice-off', notes: 'Blackwood Pond clear. Last shelf under the alder.', spread: 7 },
  { month: 4, day: 4, speciesId: 'snow', phenophase: 'snow-off', notes: 'North hollow bare at last.', spread: 8 },
  { month: 4, day: 6, speciesId: 'chipmunk', phenophase: 'first-seen', notes: 'The stone wall is occupied again.', spread: 6 },
  { month: 4, day: 9, speciesId: 'crocus', phenophase: 'first-flower', notes: 'Garden edge, by the gate.', spread: 7 },
  { month: 4, day: 12, speciesId: 'tree-swallow', phenophase: 'arrival', notes: 'Pair over the pond. Checking the box.', spread: 5 },
  { month: 4, day: 15, speciesId: 'forsythia', phenophase: 'first-flower', notes: 'The hedge has gone yellow overnight.', spread: 5 },
  { month: 4, day: 18, speciesId: 'frost', phenophase: 'last-frost', notes: 'Lawn silver at dawn. Then nothing after.', spread: 8 },
  { month: 4, day: 20, speciesId: 'daffodil', phenophase: 'first-flower', notes: 'King Alfreds, south bed.', spread: 6 },
  { month: 4, day: 24, speciesId: 'morel', phenophase: 'first-seen', notes: 'Two under the dying elm. Left them.', spread: 6 },
  { month: 4, day: 28, speciesId: 'lilac', phenophase: 'first-leaf', notes: 'Leaves the size of a mouse’s ear.', spread: 4 },
  { month: 5, day: 2, speciesId: 'serviceberry', phenophase: 'first-flower', notes: 'White foam along the ridge trail.', spread: 5 },
  { month: 5, day: 6, speciesId: 'trillium', phenophase: 'first-flower', notes: 'Wake-robin on the east slope. Three plants.', spread: 4 },
  { month: 5, day: 10, speciesId: 'lilac', phenophase: 'first-flower', notes: 'First open floret. Scent in the evening air.', spread: 4 },
  { month: 5, day: 14, speciesId: 'apple', phenophase: 'first-flower', notes: 'The old Baldwin by the barn.', spread: 5 },
  { month: 5, day: 16, speciesId: 'wood-thrush', phenophase: 'arrival', notes: 'Song at 8:40 from the hemlock shade.', spread: 4 },
  { month: 5, day: 18, speciesId: 'lilac', phenophase: 'full-flower', notes: 'The whole hedge. Bees loud in it.', spread: 3 },
  { month: 5, day: 22, speciesId: 'american-robin', phenophase: 'nesting', notes: 'Nest in the eaves. Three eggs.', spread: 6 },
  { month: 5, day: 26, speciesId: 'luna-moth', phenophase: 'first-seen', notes: 'On the screen door at night. Fresh, still damp.', spread: 8 },
  { month: 6, day: 2, speciesId: 'firefly', phenophase: 'first-seen', notes: 'One flash in the lower meadow. Then two.', spread: 5 },
  { month: 6, day: 8, speciesId: 'milkweed', phenophase: 'first-leaf', notes: 'Opposite leaves, twelve centimetres.', spread: 5 },
  { month: 6, day: 14, speciesId: 'firefly', phenophase: 'peak-activity', notes: 'The meadow is a harbour of lights.', spread: 6 },
  { month: 6, day: 20, speciesId: 'monarch', phenophase: 'arrival', notes: 'Nectaring on the first milkweed buds.', spread: 7 },
  { month: 7, day: 6, speciesId: 'milkweed', phenophase: 'first-flower', notes: 'Scent heavy after rain.', spread: 5 },
  { month: 7, day: 18, speciesId: 'cicada', phenophase: 'calling', notes: 'The oaks have started. Heat 31°C.', spread: 6 },
  { month: 8, day: 2, speciesId: 'katydid', phenophase: 'calling', notes: 'First true katy-did from the maples.', spread: 6 },
  { month: 8, day: 12, speciesId: 'chicken-of-woods', phenophase: 'first-seen', notes: 'On the fallen cherry. Bright sulphur.', spread: 8 },
  { month: 8, day: 24, speciesId: 'goldenrod', phenophase: 'first-flower', notes: 'Roadside, in full sun.', spread: 5 },
  { month: 9, day: 4, speciesId: 'monarch', phenophase: 'departure', notes: 'A stream of them south along the ridge, mid-morning.', spread: 7 },
  { month: 9, day: 10, speciesId: 'aster', phenophase: 'first-flower', notes: 'Purple at the field edge.', spread: 5 },
  { month: 9, day: 18, speciesId: 'red-maple', phenophase: 'color-change', notes: 'First true scarlet on the swamp edge.', spread: 6 },
  { month: 9, day: 28, speciesId: 'sugar-maple', phenophase: 'color-change', notes: 'The ridge has caught fire.', spread: 5 },
  { month: 10, day: 6, speciesId: 'frost', phenophase: 'first-frost', notes: 'Garden blackened. 28°F on the porch.', spread: 7 },
  { month: 10, day: 12, speciesId: 'witch-hazel', phenophase: 'first-flower', notes: 'Ribbon petals on the lower path.', spread: 6 },
  { month: 10, day: 18, speciesId: 'dark-eyed-junco', phenophase: 'arrival', notes: 'Dark-eyed juncos under the feeders.', spread: 6 },
  { month: 10, day: 22, speciesId: 'ginkgo', phenophase: 'leaf-fall', notes: 'The town tree dropped in one night.', spread: 5 },
  { month: 10, day: 28, speciesId: 'red-maple', phenophase: 'leaf-fall', notes: 'Mostly bare. Petioles in the ruts.', spread: 6 },
  { month: 11, day: 14, speciesId: 'snow', phenophase: 'snow-on', notes: 'First covering. Two centimetres, gone by noon — but it counted.', spread: 8 },
  { month: 12, day: 8, speciesId: 'ice', phenophase: 'ice-on', notes: 'Blackwood Pond skimmed. Held through the night.', spread: 7 },
]

export const SAMPLE_STATION: Station = {
  name: 'Blackwood Hollow',
  observer: 'Sample keeper',
  lat: 42.447,
  lon: -71.229,
  timezone: 'America/New_York',
  hemisphere: 'N',
  established: '2024-01-01',
  bio: 'A made-up New England hollow for walking the ring before you keep your own. Delete it whenever you like.',
  sample: true,
}

/** Sample is a flag, not a name. The fingerprint only recognizes the canned hollow. */
export function isSampleStation(station: Station | null | undefined): boolean {
  if (!station) return false
  if (station.sample === true) return true
  return (
    station.name === SAMPLE_STATION.name &&
    station.observer === SAMPLE_STATION.observer &&
    station.lat === SAMPLE_STATION.lat &&
    station.lon === SAMPLE_STATION.lon
  )
}

export function buildSampleObservations(now = new Date()): Observation[] {
  const thisYear = now.getFullYear()
  const years = [thisYear - 2, thisYear - 1, thisYear]
  const out: Observation[] = []
  const today = isoDate(now)

  for (const year of years) {
    for (const event of EVENTS) {
      const base = `${year}-${String(event.month).padStart(2, '0')}-${String(event.day).padStart(2, '0')}`
      const date = withJitter(base, `${year}:${event.speciesId}:${event.phenophase}`, event.spread)
      if (year === thisYear && date > today) continue
      const created = `${date}T12:00:00.000Z`
      out.push({
        id: makeId(),
        speciesId: event.speciesId,
        phenophase: event.phenophase,
        date,
        notes: event.notes,
        lat: SAMPLE_STATION.lat,
        lon: SAMPLE_STATION.lon,
        createdAt: created,
        updatedAt: created,
      })
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date))
}
