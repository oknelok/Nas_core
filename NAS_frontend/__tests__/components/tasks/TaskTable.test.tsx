import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TaskTable from '@/components/tasks/TaskTable'
import type { TaskConsoleRow } from '@/types/maestro'

const mockPush = jest.fn()

jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({ push: mockPush })),
}))

const task: TaskConsoleRow = {
  id: '1651',
  task_label: 'Issue With Your Receipt',
  process_name: 'Expense Workflow',
  created: '1711929600',
  active_handler: 'http://maestro-d11-dev/maestro/execute/task/test-token-abc123/notmodal',
}

describe('TaskTable', () => {
  beforeEach(() => mockPush.mockClear())

  it('renders task label and process name', () => {
    render(<TaskTable tasks={[task]} />)
    expect(screen.getByText('Issue With Your Receipt')).toBeInTheDocument()
    expect(screen.getByText('Expense Workflow')).toBeInTheDocument()
  })

  it('renders empty state when tasks array is empty', () => {
    render(<TaskTable tasks={[]} />)
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
  })

  it('navigates to /tasks/[token] when Execute is clicked', async () => {
    render(<TaskTable tasks={[task]} />)
    await userEvent.click(screen.getByTestId('execute-test-token-abc123'))
    expect(mockPush).toHaveBeenCalledWith('/tasks/test-token-abc123')
  })
})
