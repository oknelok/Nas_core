import { getRefreshInterval, setRefreshInterval } from '@/lib/app-settings'

const STORAGE_KEY = 'maestro_refresh_interval'

describe('getRefreshInterval', () => {
  beforeEach(() => {
    localStorage.clear()
    delete process.env.NEXT_PUBLIC_REFRESH_INTERVAL
  })

  it('returns localStorage value when set', () => {
    localStorage.setItem(STORAGE_KEY, '15000')
    expect(getRefreshInterval()).toBe(15000)
  })

  it('falls back to NEXT_PUBLIC_REFRESH_INTERVAL when localStorage is empty', () => {
    process.env.NEXT_PUBLIC_REFRESH_INTERVAL = '45000'
    expect(getRefreshInterval()).toBe(45000)
  })

  it('falls back to 30000 when neither localStorage nor env is set', () => {
    expect(getRefreshInterval()).toBe(30000)
  })

  it('ignores invalid localStorage value and falls back to env', () => {
    localStorage.setItem(STORAGE_KEY, 'not-a-number')
    process.env.NEXT_PUBLIC_REFRESH_INTERVAL = '20000'
    expect(getRefreshInterval()).toBe(20000)
  })
})

describe('setRefreshInterval', () => {
  it('writes ms value to localStorage as string', () => {
    setRefreshInterval(20000)
    expect(localStorage.getItem(STORAGE_KEY)).toBe('20000')
  })
})
