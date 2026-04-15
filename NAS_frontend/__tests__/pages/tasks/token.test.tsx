jest.mock('swr')

const mockPush = jest.fn()
jest.mock('next/router', () => ({
  useRouter: () => ({ query: { token: 'test-token-abc123' }, push: mockPush }),
}))
jest.mock('@/lib/drupal-client', () => ({
  drupalGet: jest.fn(),
  drupalPost: jest.fn(),
  drupalFileUpload: jest.fn(),
  DrupalClientError: class DrupalClientError extends Error {
    status: number
    constructor(message: string, status: number) { super(message); this.status = status }
  },
}))

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import useSWR from 'swr'
import { drupalPost, DrupalClientError } from '@/lib/drupal-client'
import TaskPage from '@/pages/tasks/[token]'

const MOCK_QUEUE_ITEM = {
  id: 'test-token-abc123',
  type: 'maestro_queue--maestro_queue',
  attributes: {
    drupal_internal__id: 1614,
    task_label: 'Issue With Your Receipt',
    task_class_name: 'MaestroWebform',
    started_date: 1774298042,
    task_data: { webform_machine_name: 'simple_expense_report_example', show_edit_form: false },
  },
  relationships: {
    process_id: { data: { id: 'process-uuid-1', type: 'maestro_process--maestro_process' } },
  },
}

const MOCK_PROCESS = {
  id: 'process-uuid-1',
  type: 'maestro_process--maestro_process',
  attributes: { drupal_internal__process_id: 102, process_name: 'Expense Report Workflow' },
}

const MOCK_WEBFORM_FIELDS = {
  date: { '#type': 'date', '#title': 'Date', '#required': true, '#webform_key': 'date' },
  expense_total: { '#type': 'textfield', '#title': 'Expense Total', '#required': false, '#webform_key': 'expense_total' },
  receipt_upload: { '#type': 'webform_image_file', '#title': 'Receipt Upload', '#required': false, '#webform_key': 'receipt_upload' },
}

const mockUseSWR = useSWR as jest.MockedFunction<typeof useSWR>
const mockDrupalPost = drupalPost as jest.MockedFunction<typeof drupalPost>

function mockFullLoad() {
  mockUseSWR
    .mockReturnValueOnce({ data: { data: MOCK_QUEUE_ITEM, included: [MOCK_PROCESS] }, error: undefined } as any)
    .mockReturnValueOnce({ data: MOCK_WEBFORM_FIELDS, error: undefined } as any)
}

describe('TaskPage', () => {
  beforeEach(() => jest.clearAllMocks())

  it('shows loading when data not yet available', () => {
    mockUseSWR.mockReturnValue({ data: undefined, error: undefined } as any)
    render(<TaskPage />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders task label and form fields', () => {
    mockFullLoad()
    render(<TaskPage />)
    expect(screen.getByText('Issue With Your Receipt')).toBeInTheDocument()
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/expense total/i)).toBeInTheDocument()
  })

  it('includes maestro fields in submission body', async () => {
    mockFullLoad()
    mockDrupalPost.mockResolvedValue({ sid: 99 })
    render(<TaskPage />)
    await userEvent.click(screen.getByRole('button', { name: /submit/i }))
    await waitFor(() => expect(mockDrupalPost).toHaveBeenCalled())
    const body = mockDrupalPost.mock.calls[0][1] as Record<string, unknown>
    expect(body['maestro[queue_id]']).toBe(1614)
    expect(body['maestro[process_id]']).toBe(102)
    expect(body['maestro[type]']).toBe('simple_expense_report_example')
  })

  it('shows error message when submission returns 4xx', async () => {
    mockFullLoad()
    mockDrupalPost.mockRejectedValue(new DrupalClientError('Bad request', 400))
    render(<TaskPage />)
    await userEvent.click(screen.getByRole('button', { name: /submit/i }))
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  })

  it('uploads file and includes fid in submission body', async () => {
    const { drupalFileUpload } = await import('@/lib/drupal-client')
    const mockDrupalFileUpload = drupalFileUpload as jest.MockedFunction<typeof drupalFileUpload>
    mockDrupalFileUpload.mockResolvedValue(7)
    mockDrupalPost.mockResolvedValue({ sid: 99 })
    mockFullLoad()
    render(<TaskPage />)
    const file = new File(['data'], 'receipt.jpg', { type: 'image/jpeg' })
    await userEvent.upload(screen.getByLabelText(/receipt upload/i), file)
    await userEvent.click(screen.getByRole('button', { name: /submit/i }))
    await waitFor(() => expect(mockDrupalFileUpload).toHaveBeenCalledWith(
      'webform_submission', 'simple_expense_report_example', 'receipt_upload', file
    ))
    await waitFor(() => expect(mockDrupalPost).toHaveBeenCalled())
    const fileUploadOrder = mockDrupalFileUpload.mock.invocationCallOrder[0]
    const postOrder = mockDrupalPost.mock.invocationCallOrder[0]
    expect(fileUploadOrder).toBeLessThan(postOrder)
    const body = mockDrupalPost.mock.calls[0][1] as Record<string, unknown>
    expect(body['receipt_upload']).toBe(7)
  })

  it('shows error when queue fetch fails', () => {
    mockUseSWR
      .mockReturnValueOnce({ data: undefined, error: new Error('not found') } as any)
      .mockReturnValueOnce({ data: undefined, error: undefined } as any)
    render(<TaskPage />)
    expect(screen.getByRole('alert')).toHaveTextContent(/task not found/i)
  })
})
