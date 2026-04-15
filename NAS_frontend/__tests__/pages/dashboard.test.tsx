jest.mock('next-auth/react', () => ({ signOut: jest.fn() }))
jest.mock('@/lib/app-settings', () => ({
  getRefreshInterval: jest.fn().mockReturnValue(30000),
  setRefreshInterval: jest.fn(),
}))

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setRefreshInterval } from '@/lib/app-settings'
import DashboardPage from '@/pages/dashboard'

describe('DashboardPage', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders refresh interval input in seconds', async () => {
    render(<DashboardPage />)
    await waitFor(() =>
      expect(screen.getByLabelText(/refresh interval/i)).toHaveValue(30)
    )
  })

  it('calls setRefreshInterval with ms when input changes to valid value', async () => {
    render(<DashboardPage />)
    const input = screen.getByLabelText(/refresh interval/i)
    await userEvent.clear(input)
    await userEvent.type(input, '60')
    expect(setRefreshInterval).toHaveBeenLastCalledWith(60000)
  })

  it('renders logout button', () => {
    render(<DashboardPage />)
    expect(screen.getByTestId('logout-button')).toBeInTheDocument()
  })
})
