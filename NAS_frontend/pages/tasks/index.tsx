// pages/tasks/index.tsx
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import TaskTable from '@/components/tasks/TaskTable'
import { drupalGet } from '@/lib/drupal-client'
import { getRefreshInterval } from '@/lib/app-settings'
import type { TaskConsoleResponse } from '@/types/maestro'

export default function TasksPage() {
  const router = useRouter()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (router.query.completed === '1') {
      setSuccessMessage('Task completed successfully.')
      router.replace('/tasks', undefined, { shallow: true })
    }
  }, [router.query.completed, router])

  const { data, error } = useSWR<TaskConsoleResponse>('api/maestro/task-console', drupalGet, {
    refreshInterval: getRefreshInterval(),
    revalidateOnFocus: true,
  })

  return (
    <main>
      <nav>
        <Link href="/dashboard">Dashboard</Link>
      </nav>
      <h1>Task Console</h1>
      {successMessage && <p role="status">{successMessage}</p>}
      {error && <p role="alert">Failed to load tasks. Please refresh.</p>}
      {!data && !error && <p>Loading…</p>}
      {data && <TaskTable tasks={data} />}
    </main>
  )
}
