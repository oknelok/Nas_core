jest.mock('next-auth/react', () => ({ signIn: jest.fn() }))
jest.mock('next/router', () => ({ useRouter: () => ({ push: jest.fn() }) }))

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { signIn } from 'next-auth/react'
import LoginPage from '@/pages/login'

const mockSignIn = signIn as jest.MockedFunction<typeof signIn>

describe('LoginPage', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders username and password fields', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('calls signIn with credentials on submit', async () => {
    mockSignIn.mockResolvedValue({ ok: true, error: null } as any)
    render(<LoginPage />)

    await userEvent.type(screen.getByLabelText(/username/i), 'admin')
    await userEvent.type(screen.getByLabelText(/password/i), 'secret')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(mockSignIn).toHaveBeenCalledWith('credentials', {
      username: 'admin',
      password: 'secret',
      redirect: false,
    })
  })

  it('shows error message on failed login', async () => {
    mockSignIn.mockResolvedValue({ ok: false, error: 'CredentialsSignin' } as any)
    render(<LoginPage />)

    await userEvent.type(screen.getByLabelText(/username/i), 'admin')
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/invalid credentials/i)
    )
  })
})
