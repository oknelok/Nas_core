// mock next-auth/react before importing drupal-client
jest.mock('next-auth/react', () => ({ signOut: jest.fn() }))
import { signOut } from 'next-auth/react'
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>

describe('drupalGet', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  it('fetches from /api/drupal/ and returns parsed JSON', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ data: [] }),
    })

    const { drupalGet } = await import('@/lib/drupal-client')
    const result = await drupalGet('/jsonapi/maestro_queue/maestro_queue')

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/drupal/jsonapi/maestro_queue/maestro_queue',
      expect.any(Object)
    )
    expect(result).toEqual({ data: [] })
  })

  it('calls signOut and throws on 401', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ status: 401 })
    mockSignOut.mockResolvedValue(undefined as any)

    const { drupalGet, DrupalClientError } = await import('@/lib/drupal-client')

    await expect(drupalGet('/jsonapi/maestro_queue/maestro_queue')).rejects.toThrow(DrupalClientError)
    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/login' })
  })

  it('throws DrupalClientError on 502', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ status: 502 })

    const { drupalGet, DrupalClientError } = await import('@/lib/drupal-client')

    await expect(drupalGet('/jsonapi/maestro_queue/maestro_queue')).rejects.toThrow(DrupalClientError)
  })

  it('still throws DrupalClientError on 401 even if signOut rejects', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ status: 401 })
    mockSignOut.mockRejectedValue(new Error('signOut network failure'))

    const { drupalGet, DrupalClientError } = await import('@/lib/drupal-client')

    await expect(drupalGet('/some/path')).rejects.toThrow(DrupalClientError)
  })
})

describe('drupalFileUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  it('posts file as octet-stream and returns fid', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ fid: [{ value: 42 }] }),
    })

    const { drupalFileUpload } = await import('@/lib/drupal-client')
    const file = new File(['data'], 'receipt.jpg', { type: 'image/jpeg' })
    const fid = await drupalFileUpload('webform_submission', 'my_form', 'receipt_upload', file)

    expect(fid).toBe(42)
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/drupal/file/upload/webform_submission/my_form/receipt_upload',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': 'attachment; filename="receipt.jpg"',
        }),
        body: file,
      })
    )
  })

  it('throws DrupalClientError on failed upload', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ status: 422, ok: false })

    const { drupalFileUpload, DrupalClientError } = await import('@/lib/drupal-client')
    const file = new File(['data'], 'bad.jpg', { type: 'image/jpeg' })

    await expect(
      drupalFileUpload('webform_submission', 'my_form', 'receipt_upload', file)
    ).rejects.toThrow(DrupalClientError)
  })
})
