import { useState, useEffect } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { getRefreshInterval, setRefreshInterval } from '@/lib/app-settings'

export default function DashboardPage() {
  const [refreshInput, setRefreshInput] = useState<string>('30')

  useEffect(() => {
    setRefreshInput(String(getRefreshInterval() / 1000))
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/drupal-logout', { method: 'POST' })
    await signOut({ callbackUrl: '/login' })
  }

  function handleRefreshChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    setRefreshInput(raw)
    const seconds = parseInt(raw, 10)
    if (!isNaN(seconds) && seconds >= 5) {
      setRefreshInterval(seconds * 1000)
    }
  }

  return (
    <main>
      <h1>Dashboard</h1>
      <nav>
        <Link href="/tasks">Task Console</Link>
      </nav>
      <section>
        <h2>Settings</h2>
        <div>
          <label htmlFor="refresh-interval">
            Task console refresh interval (seconds)
          </label>
          <input
            id="refresh-interval"
            type="number"
            min="5"
            value={refreshInput}
            onChange={handleRefreshChange}
          />
        </div>
      </section>
      <button data-testid="logout-button" onClick={handleLogout}>
        Log out
      </button>
    </main>
  )
}
