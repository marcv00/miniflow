import type { Workflow } from "../workflow/types"

const storageKey = "miniflow_builder_workflow2"

export const loadAll = (): Workflow[] => {
  const raw = localStorage.getItem(storageKey)
  if (!raw) return []
  try {
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

export const saveAll = (arr: Workflow[]) => {
  localStorage.setItem(storageKey, JSON.stringify(arr))
}
