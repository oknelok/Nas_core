/**
 * @jest-environment node
 */
import { setupServer } from 'msw/node'
import { drupalHandlers, DRUPAL_BASE } from '../../../mocks/drupal-handlers'
import { authorizeWithDrupal } from '@/pages/api/auth/[...nextauth]'

const originalDrupalBaseUrl = process.env.DRUPAL_BASE_URL

const server = setupServer(...drupalHandlers)

beforeAll(() => {
  process.env.DRUPAL_BASE_URL = DRUPAL_BASE
  server.listen()
})
afterEach(() => server.resetHandlers())
afterAll(() => {
  process.env.DRUPAL_BASE_URL = originalDrupalBaseUrl
  server.close()
})

describe('authorizeWithDrupal', () => {
  it('returns user object on valid credentials', async () => {
    const user = await authorizeWithDrupal({ username: 'admin', password: 'correct' })
    expect(user).toMatchObject({
      id: '1',
      name: 'admin',
      roles: ['authenticated', 'administrator'],
      csrfToken: 'test-csrf-token',
      logoutToken: 'test-logout-token',
    })
    expect(user?.drupalSessionCookie).toContain('SESSabc=xyz')
  })

  it('returns null on invalid credentials', async () => {
    const user = await authorizeWithDrupal({ username: 'admin', password: 'wrong' })
    expect(user).toBeNull()
  })

  it('returns null when credentials are missing', async () => {
    const user = await authorizeWithDrupal(undefined)
    expect(user).toBeNull()
  })
})
