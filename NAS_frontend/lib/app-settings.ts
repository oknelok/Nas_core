// lib/app-settings.ts
const REFRESH_INTERVAL_KEY = 'maestro_refresh_interval'

export function getRefreshInterval(): number {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(REFRESH_INTERVAL_KEY)
    if (stored) {
      const parsed = parseInt(stored, 10)
      if (!isNaN(parsed) && parsed > 0) return parsed
    }
  }
  const envVal = process.env.NEXT_PUBLIC_REFRESH_INTERVAL
  if (envVal) {
    const parsed = parseInt(envVal, 10)
    if (!isNaN(parsed) && parsed > 0) return parsed
  }
  return 30000
}

export function setRefreshInterval(ms: number): void {
  localStorage.setItem(REFRESH_INTERVAL_KEY, String(ms))
}
