jest.mock('swr')

// Mutable router object — individual tests can set query before rendering
const mockReplace = jest.fn()
const mockRouterData = { query: {} as Record<string, string>, replace: mockReplace, push: jest.fn() }
jest.mock('next/router', () => ({ useRouter: () => mockRouterData }))

jest.mock('@/lib/drupal-client', () => ({ drupalGet: jest.fn() }))
jest.mock('@/lib/app-settings', () => ({ getRefreshInterval: () => 30000 }))
jest.mock('@/components/tasks/TaskTable', () => ({
  __esModule: true,
  default: ({ tasks }: { tasks: unknown[] }) => (
    <div data-testid="task-table">Tasks: {tasks.length}</div>
  ),
}))

import { render, screen, waitFor } from '@testing-library/react'
import useSWR from 'swr'
import TasksPage from '@/pages/tasks/index'

const MOCK_CONSOLE_ROW = {
  id: '1651',
  task_label: 'Issue With Your Receipt',
  process_name: 'Expense Report Workflow',
  created: '1774298042',
  active_handler: 'http://maestro-d11-dev/maestro/execute/task/test-token-abc123/notmodal',
}

const mockUseSWR = useSWR as jest.MockedFunction<typeof useSWR>

describe('TasksPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRouterData.query = {}
  })

  it('shows loading state while fetching', () => {
    mockUseSWR.mockReturnValue({ data: undefined, error: undefined } as any)
    render(<TasksPage />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders TaskTable with tasks on success', () => {
    mockUseSWR.mockReturnValue({ data: [MOCK_CONSOLE_ROW], error: undefined } as any)
    render(<TasksPage />)
    expect(screen.getByTestId('task-table')).toBeInTheDocument()
    expect(screen.getByText('Tasks: 1')).toBeInTheDocument()
  })

  it('shows error message when fetch fails', () => {
    mockUseSWR.mockReturnValue({ data: undefined, error: new Error('fail') } as any)
    render(<TasksPage />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('shows success toast when ?completed=1 is in query', async () => {
    mockRouterData.query = { completed: '1' }
    mockUseSWR.mockReturnValue({ data: [], error: undefined } as any)
    render(<TasksPage />)
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/task completed/i))
    expect(mockReplace).toHaveBeenCalledWith('/tasks', undefined, { shallow: true })
  })
})
