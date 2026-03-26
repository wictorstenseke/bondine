import { useState, useCallback } from "react"
import type { StorageAdapter, Visit } from "./types"

export function useVisits(adapter: StorageAdapter) {
  const [visits, setVisits] = useState<Visit[]>(() => adapter.getVisits())

  const addVisit = useCallback(
    (visit: Visit) => {
      adapter.addVisit(visit)
      setVisits(adapter.getVisits())
    },
    [adapter],
  )

  const updateVisit = useCallback(
    (visit: Visit) => {
      adapter.updateVisit(visit)
      setVisits(adapter.getVisits())
    },
    [adapter],
  )

  const deleteVisit = useCallback(
    (id: string) => {
      adapter.deleteVisit(id)
      setVisits(adapter.getVisits())
    },
    [adapter],
  )

  return { visits, addVisit, updateVisit, deleteVisit }
}
