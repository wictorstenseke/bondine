import type { StorageAdapter, Visit } from "./types"

const KEY = "bondine_visits"

function load(): Visit[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Visit[]) : []
  } catch {
    return []
  }
}

function save(visits: Visit[]): void {
  localStorage.setItem(KEY, JSON.stringify(visits))
}

export const localStorageAdapter: StorageAdapter = {
  getVisits() {
    return load()
  },

  addVisit(visit) {
    save([...load(), visit])
  },

  updateVisit(visit) {
    save(load().map((v) => (v.id === visit.id ? visit : v)))
  },

  deleteVisit(id) {
    save(load().filter((v) => v.id !== id))
  },
}
