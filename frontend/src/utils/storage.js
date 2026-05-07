const STORAGE_KEY = 'maic-dashboard-state'

export const readStoredState = () => {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch (error) {
    return null
  }
}

export const writeStoredState = (payload) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}
