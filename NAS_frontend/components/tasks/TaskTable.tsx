// components/tasks/TaskTable.tsx
import { useRouter } from 'next/router'
import type { TaskConsoleRow } from '@/types/maestro'

interface Props {
  tasks: TaskConsoleRow[]
}

function extractToken(activeHandler: string): string {
  const parts = activeHandler.split('/')
  const taskIndex = parts.indexOf('task')
  return taskIndex !== -1 ? parts[taskIndex + 1] : ''
}

export default function TaskTable({ tasks }: Props) {
  const router = useRouter()

  if (tasks.length === 0) {
    return <p data-testid="empty-state">No tasks assigned to you.</p>
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Task</th>
          <th>Process</th>
          <th>Started</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {tasks.map(task => {
          const token = extractToken(task.active_handler)
          return (
            <tr key={task.id}>
              <td>{task.task_label}</td>
              <td>{task.process_name}</td>
              <td>{new Date(parseInt(task.created) * 1000).toLocaleDateString()}</td>
              <td>
                <button
                  data-testid={`execute-${token}`}
                  onClick={() => router.push(`/tasks/${token}`)}
                >
                  Execute
                </button>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
