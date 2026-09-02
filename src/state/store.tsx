import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Observation, Settings, Species, Station, View } from '../types'
import { allSpecies, makeId } from '../lib/ids'
import { buildSampleObservations, SAMPLE_STATION } from '../lib/sample'
import * as db from '../lib/storage'

interface Store {
  ready: boolean
  station: Station | null
  observations: Observation[]
  customSpecies: Species[]
  species: Species[]
  settings: Settings
  view: View
  selectedId: string | null
  formOpen: boolean
  formDate: string | null
  query: string
  setView: (view: View) => void
  setSelectedId: (id: string | null) => void
  setQuery: (q: string) => void
  openForm: (date?: string, existingId?: string) => void
  closeForm: () => void
  saveStation: (station: Station) => Promise<void>
  saveObservation: (input: Omit<Observation, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<void>
  removeObservation: (id: string) => Promise<void>
  saveCustomSpecies: (species: Species) => Promise<void>
  removeCustomSpecies: (id: string) => Promise<void>
  updateSettings: (patch: Partial<Settings>) => Promise<void>
  loadSample: () => Promise<void>
  restore: (station: Station | null, observations: Observation[], custom: Species[], settings: Settings) => Promise<void>
  resetAll: () => Promise<void>
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [station, setStation] = useState<Station | null>(null)
  const [observations, setObservations] = useState<Observation[]>([])
  const [customSpecies, setCustomSpecies] = useState<Species[]>([])
  const [settings, setSettings] = useState<Settings>({ theme: 'paper', selectedYear: 'all' })
  const [view, setView] = useState<View>('ring')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [formDate, setFormDate] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const [s, o, c, st] = await Promise.all([
          db.loadStation(),
          db.loadObservations(),
          db.loadCustomSpecies(),
          db.loadSettings(),
        ])
        if (cancelled) return
        setStation(s)
        setObservations(o)
        setCustomSpecies(c)
        setSettings(st)
      } catch (err) {
        console.error('Witness Tree failed to open its ledger.', err)
      } finally {
        if (!cancelled) setReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme
  }, [settings.theme])

  const species = useMemo(() => allSpecies(customSpecies), [customSpecies])

  const saveStation = useCallback(async (next: Station) => {
    await db.saveStation(next)
    setStation(next)
  }, [])

  const saveObservation = useCallback(
    async (input: Omit<Observation, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      const now = new Date().toISOString()
      const existing = input.id ? observations.find((o) => o.id === input.id) : undefined
      const obs: Observation = {
        id: existing?.id ?? makeId(),
        speciesId: input.speciesId,
        phenophase: input.phenophase,
        date: input.date,
        notes: input.notes,
        lat: input.lat,
        lon: input.lon,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      }
      await db.putObservation(obs)
      setObservations((prev) => {
        const next = existing ? prev.map((o) => (o.id === obs.id ? obs : o)) : [obs, ...prev]
        return next.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
      })
      setSelectedId(obs.id)
    },
    [observations],
  )

  const removeObservation = useCallback(async (id: string) => {
    await db.deleteObservation(id)
    setObservations((prev) => prev.filter((o) => o.id !== id))
    setSelectedId((current) => (current === id ? null : current))
  }, [])

  const saveCustomSpecies = useCallback(async (entry: Species) => {
    await db.putSpecies(entry)
    setCustomSpecies((prev) => {
      const i = prev.findIndex((s) => s.id === entry.id)
      if (i === -1) return [...prev, entry]
      const next = [...prev]
      next[i] = entry
      return next
    })
  }, [])

  const removeCustomSpecies = useCallback(async (id: string) => {
    await db.deleteSpecies(id)
    setCustomSpecies((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch }
    await db.saveSettings(next)
    setSettings(next)
  }, [settings])

  const restore = useCallback(
    async (
      nextStation: Station | null,
      nextObs: Observation[],
      nextCustom: Species[],
      nextSettings: Settings,
    ) => {
      await db.replaceAll({
        version: 1,
        exportedAt: new Date().toISOString(),
        station: nextStation,
        observations: nextObs,
        customSpecies: nextCustom,
        settings: nextSettings,
      })
      setStation(nextStation)
      setObservations(
        [...nextObs].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
      )
      setCustomSpecies(nextCustom)
      setSettings(nextSettings)
      setSelectedId(null)
    },
    [],
  )

  const loadSample = useCallback(async () => {
    await restore(SAMPLE_STATION, buildSampleObservations(), [], {
      theme: settings.theme,
      selectedYear: 'all',
    })
    setView('ring')
  }, [restore, settings.theme])

  const resetAll = useCallback(async () => {
    await db.wipeAll()
    setStation(null)
    setObservations([])
    setCustomSpecies([])
    setSettings({ theme: settings.theme, selectedYear: 'all' })
    setSelectedId(null)
    setFormOpen(false)
    setView('ring')
  }, [settings.theme])

  const openForm = useCallback((date?: string, existingId?: string) => {
    setSelectedId(existingId ?? null)
    setFormDate(date ?? null)
    setFormOpen(true)
  }, [])

  const closeForm = useCallback(() => {
    setFormOpen(false)
    setFormDate(null)
  }, [])

  const value = useMemo<Store>(
    () => ({
      ready,
      station,
      observations,
      customSpecies,
      species,
      settings,
      view,
      selectedId,
      formOpen,
      formDate,
      query,
      setView,
      setSelectedId,
      setQuery,
      openForm,
      closeForm,
      saveStation,
      saveObservation,
      removeObservation,
      saveCustomSpecies,
      removeCustomSpecies,
      updateSettings,
      loadSample,
      restore,
      resetAll,
    }),
    [
      ready,
      station,
      observations,
      customSpecies,
      species,
      settings,
      view,
      selectedId,
      formOpen,
      formDate,
      query,
      openForm,
      closeForm,
      saveStation,
      saveObservation,
      removeObservation,
      saveCustomSpecies,
      removeCustomSpecies,
      updateSettings,
      loadSample,
      restore,
      resetAll,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
