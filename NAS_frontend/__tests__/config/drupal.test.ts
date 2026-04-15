// @jest-environment node
describe('getDrupalBaseUrl', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns DRUPAL_BASE_URL without trailing slash', async () => {
    process.env.DRUPAL_BASE_URL = 'http://drupal.test/'
    const { getDrupalBaseUrl } = await import('@/config/drupal')
    expect(getDrupalBaseUrl()).toBe('http://drupal.test')
  })

  it('throws when DRUPAL_BASE_URL is not set', async () => {
    delete process.env.DRUPAL_BASE_URL
    const { getDrupalBaseUrl } = await import('@/config/drupal')
    expect(() => getDrupalBaseUrl()).toThrow('DRUPAL_BASE_URL environment variable is not set')
  })
})
