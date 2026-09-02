import type { BackupFile, Observation, Settings, Species, Station } from '../types'

const DB_NAME = 'witness-tree'
const DB_VERSION = 1
const OPEN_MS = 2500

type Memory = {
  station: Station | null
  settings: Settings
  observations: Observation[]
  species: Species[]
}

const memory: Memory = {
  station: null,
  settings: { theme: 'paper', selectedYear: 'all' },
  observations: [],
  species: [],
}

let mode: 'unknown' | 'idb' | 'memory' = 'unknown'

function defaultSettings(value?: Settings): Settings {
  return {
    theme: value?.theme ?? 'paper',
    selectedYear: value?.selectedYear ?? 'all',
  }
}

function sortObs(rows: Observation[]): Observation[] {
  return [...rows].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv')
      if (!db.objectStoreNames.contains('observations')) {
        const obs = db.createObjectStore('observations', { keyPath: 'id' })
        obs.createIndex('date', 'date')
        obs.createIndex('speciesId', 'speciesId')
      }
      if (!db.objectStoreNames.contains('species')) {
        db.createObjectStore('species', { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'))
  })
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('IndexedDB timed out')), ms)
    promise.then(
      (value) => {
        clearTimeout(t)
        resolve(value)
      },
      (err: unknown) => {
        clearTimeout(t)
        reject(err)
      },
    )
  })
}

async function backend(): Promise<'idb' | 'memory'> {
  if (mode !== 'unknown') return mode
  try {
    const db = await withTimeout(openDb(), OPEN_MS)
    db.close()
    mode = 'idb'
  } catch {
    mode = 'memory'
  }
  return mode
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

function reqTo<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function withStore<T>(
  names: string | string[],
  modeTx: IDBTransactionMode,
  fn: (tx: IDBTransaction) => Promise<T> | T,
): Promise<T> {
  const db = await openDb()
  try {
    const tx = db.transaction(names, modeTx)
    const value = await fn(tx)
    await txDone(tx)
    return value
  } finally {
    db.close()
  }
}

export async function loadStation(): Promise<Station | null> {
  if ((await backend()) === 'memory') return memory.station
  const value = await withStore('kv', 'readonly', (tx) => reqTo(tx.objectStore('kv').get('station')))
  return (value as Station | undefined) ?? null
}

export async function saveStation(station: Station): Promise<void> {
  if ((await backend()) === 'memory') {
    memory.station = station
    return
  }
  await withStore('kv', 'readwrite', (tx) => {
    tx.objectStore('kv').put(station, 'station')
  })
}

export async function loadSettings(): Promise<Settings> {
  if ((await backend()) === 'memory') return defaultSettings(memory.settings)
  const value = await withStore('kv', 'readonly', (tx) => reqTo(tx.objectStore('kv').get('settings')))
  return defaultSettings(value as Settings | undefined)
}

export async function saveSettings(settings: Settings): Promise<void> {
  if ((await backend()) === 'memory') {
    memory.settings = settings
    return
  }
  await withStore('kv', 'readwrite', (tx) => {
    tx.objectStore('kv').put(settings, 'settings')
  })
}

export async function loadObservations(): Promise<Observation[]> {
  if ((await backend()) === 'memory') return sortObs(memory.observations)
  const rows = await withStore('observations', 'readonly', (tx) =>
    reqTo(tx.objectStore('observations').getAll()),
  )
  return sortObs(rows as Observation[])
}

export async function putObservation(obs: Observation): Promise<void> {
  if ((await backend()) === 'memory') {
    memory.observations = sortObs([
      ...memory.observations.filter((row) => row.id !== obs.id),
      obs,
    ])
    return
  }
  await withStore('observations', 'readwrite', (tx) => {
    tx.objectStore('observations').put(obs)
  })
}

export async function deleteObservation(id: string): Promise<void> {
  if ((await backend()) === 'memory') {
    memory.observations = memory.observations.filter((row) => row.id !== id)
    return
  }
  await withStore('observations', 'readwrite', (tx) => {
    tx.objectStore('observations').delete(id)
  })
}

export async function loadCustomSpecies(): Promise<Species[]> {
  if ((await backend()) === 'memory') return [...memory.species]
  const rows = await withStore('species', 'readonly', (tx) => reqTo(tx.objectStore('species').getAll()))
  return rows as Species[]
}

export async function putSpecies(species: Species): Promise<void> {
  if ((await backend()) === 'memory') {
    memory.species = [...memory.species.filter((row) => row.id !== species.id), species]
    return
  }
  await withStore('species', 'readwrite', (tx) => {
    tx.objectStore('species').put(species)
  })
}

export async function deleteSpecies(id: string): Promise<void> {
  if ((await backend()) === 'memory') {
    memory.species = memory.species.filter((row) => row.id !== id)
    return
  }
  await withStore('species', 'readwrite', (tx) => {
    tx.objectStore('species').delete(id)
  })
}

export async function replaceAll(backup: BackupFile): Promise<void> {
  if ((await backend()) === 'memory') {
    memory.station = backup.station
    memory.settings = defaultSettings(backup.settings)
    memory.observations = sortObs(backup.observations)
    memory.species = [...backup.customSpecies]
    return
  }
  await withStore(['kv', 'observations', 'species'], 'readwrite', (tx) => {
    tx.objectStore('kv').put(backup.station, 'station')
    tx.objectStore('kv').put(backup.settings, 'settings')
    tx.objectStore('observations').clear()
    tx.objectStore('species').clear()
    for (const obs of backup.observations) tx.objectStore('observations').put(obs)
    for (const sp of backup.customSpecies) tx.objectStore('species').put(sp)
  })
}

export async function wipeAll(): Promise<void> {
  if ((await backend()) === 'memory') {
    memory.station = null
    memory.settings = defaultSettings()
    memory.observations = []
    memory.species = []
    return
  }
  await withStore(['kv', 'observations', 'species'], 'readwrite', (tx) => {
    tx.objectStore('kv').clear()
    tx.objectStore('observations').clear()
    tx.objectStore('species').clear()
  })
}
