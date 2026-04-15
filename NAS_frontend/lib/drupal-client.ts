import { signOut } from 'next-auth/react'

export class DrupalClientError extends Error {
  body?: unknown
  constructor(message: string, public status: number, body?: unknown) {
    super(message)
    this.name = 'DrupalClientError'
    this.body = body
  }
}

async function drupalFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path
  const res = await fetch(`/api/drupal/${normalizedPath}`, options)

  if (res.status === 401) {
    try {
      await signOut({ callbackUrl: '/login' })
    } catch {
      // signOut failure should not prevent the error from being thrown
    }
    throw new DrupalClientError('Session expired', 401)
  }

  if (res.status === 502) {
    throw new DrupalClientError('Service unavailable', 502)
  }

  return res
}

export async function drupalGet<T>(path: string): Promise<T> {
  const res = await drupalFetch(path, { method: 'GET' })
  if (!res.ok) throw new DrupalClientError(`HTTP ${res.status}`, res.status)
  return res.json() as Promise<T>
}

export async function drupalPost<T>(path: string, body: unknown): Promise<T> {
  const res = await drupalFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    let errorBody: unknown
    try { errorBody = await res.json() } catch { /* ignore */ }
    throw new DrupalClientError(`HTTP ${res.status}`, res.status, errorBody)
  }
  return res.json() as Promise<T>
}

export async function drupalPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await drupalFetch(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    let errorBody: unknown
    try { errorBody = await res.json() } catch { /* ignore */ }
    throw new DrupalClientError(`HTTP ${res.status}`, res.status, errorBody)
  }
  return res.json() as Promise<T>
}

export async function drupalFileUpload(
  entityType: string,
  bundle: string,
  fieldName: string,
  file: File
): Promise<number> {
  const res = await drupalFetch(
    `file/upload/${entityType}/${bundle}/${fieldName}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${file.name.replace(/"/g, '')}"`,
      },
      body: file,
    }
  )
  if (!res.ok) throw new DrupalClientError(`File upload failed: HTTP ${res.status}`, res.status)
  const data = await res.json() as { fid: Array<{ value: number }> }
  return data.fid[0].value
}
