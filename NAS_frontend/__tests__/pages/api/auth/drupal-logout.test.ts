/** @jest-environment node */
import { createMocks } from 'node-mocks-http'
import { setupServer } from 'msw/node'
import { drupalHandlers, DRUPAL_BASE } from '../../../mocks/drupal-handlers'
import handler from '@/pages/api/auth/drupal-logout'

jest.mock('next-auth/jwt')
import { getToken } from 'next-auth/jwt'
const mockGetToken = getToken as jest.MockedFunction<typeof getToken>

const server = setupServer(...drupalHandlers)

beforeAll(() => {
  process.env.DRUPAL_BASE_URL = DRUPAL_BASE
  server.listen()
})
afterEach(() => { server.resetHandlers(); jest.clearAllMocks() })
afterAll(() => {
  delete process.env.DRUPAL_BASE_URL
  server.close()
})

describe('drupal-logout', () => {
  it('calls Drupal logout and returns 200', async () => {
    mockGetToken.mockResolvedValue({
      drupalSessionCookie: 'SESSabc=xyz',
      csrfToken: 'test-csrf-token',
    } as any)

    const { req, res } = createMocks({ method: 'POST' })
    await handler(req as any, res as any)

    expect(res._getStatusCode()).toBe(200)
  })

  it('returns 200 even when no token (already logged out)', async () => {
    mockGetToken.mockResolvedValue(null)

    const { req, res } = createMocks({ method: 'POST' })
    await handler(req as any, res as any)

    expect(res._getStatusCode()).toBe(200)
  })

  it('returns 405 for non-POST methods', async () => {
    mockGetToken.mockResolvedValue(null)

    const { req, res } = createMocks({ method: 'GET' })
    await handler(req as any, res as any)

    expect(res._getStatusCode()).toBe(405)
  })
})
