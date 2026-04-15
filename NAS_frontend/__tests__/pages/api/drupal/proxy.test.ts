/** @jest-environment node */
import { http, HttpResponse } from 'msw'
import { createMocks } from 'node-mocks-http'
import { setupServer } from 'msw/node'
import { drupalHandlers, DRUPAL_BASE } from '../../../mocks/drupal-handlers'
import handler from '@/pages/api/drupal/[...path]'

// Mock next-auth/jwt so we can control the token
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

describe('Drupal proxy', () => {
  it('forwards GET request to Drupal with session cookie and returns response', async () => {
    mockGetToken.mockResolvedValue({
      drupalSessionCookie: 'SESSabc=xyz',
      csrfToken: 'test-csrf-token',
    } as any)

    const { req, res } = createMocks({
      method: 'GET',
      query: { path: ['jsonapi', 'maestro_queue', 'maestro_queue'] },
    })

    await handler(req as any, res as any)

    expect(res._getStatusCode()).toBe(200)
    const body = JSON.parse(res._getData())
    expect(body.data[0].id).toBe('test-token-abc123')
  })

  it('returns 401 when no token exists', async () => {
    mockGetToken.mockResolvedValue(null)

    const { req, res } = createMocks({
      method: 'GET',
      query: { path: ['jsonapi', 'maestro_queue', 'maestro_queue'] },
    })

    await handler(req as any, res as any)

    expect(res._getStatusCode()).toBe(401)
  })

  it('returns 502 when Drupal is unreachable', async () => {
    mockGetToken.mockResolvedValue({ drupalSessionCookie: 'SESSabc=xyz' } as any)
    server.use(
      http.get(`${DRUPAL_BASE}/jsonapi/maestro_queue/maestro_queue`, () => {
        throw new Error('Network error')
      })
    )

    const { req, res } = createMocks({
      method: 'GET',
      query: { path: ['jsonapi', 'maestro_queue', 'maestro_queue'] },
    })

    await handler(req as any, res as any)

    expect(res._getStatusCode()).toBe(502)
  })

  it('returns 401 when Drupal returns 403 (expired session)', async () => {
    mockGetToken.mockResolvedValue({ drupalSessionCookie: 'SESSabc=xyz' } as any)
    server.use(
      http.get(`${DRUPAL_BASE}/jsonapi/maestro_queue/maestro_queue`, () => {
        return new HttpResponse(null, { status: 403 })
      })
    )

    const { req, res } = createMocks({
      method: 'GET',
      query: { path: ['jsonapi', 'maestro_queue', 'maestro_queue'] },
    })

    await handler(req as any, res as any)

    expect(res._getStatusCode()).toBe(401)
  })
})
