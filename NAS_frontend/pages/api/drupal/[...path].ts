import type { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt'
import { getDrupalBaseUrl } from '@/config/drupal'

export const config = { api: { bodyParser: false, externalResolver: true } }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = await getToken({ req })
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { path, ...queryParams } = req.query
  const drupalPath = Array.isArray(path) ? path.join('/') : (path ?? '')

  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(queryParams)) {
    if (Array.isArray(value)) value.forEach(v => searchParams.append(key, v))
    else if (value) searchParams.set(key, value)
  }
  const qs = searchParams.toString()
  const url = `${getDrupalBaseUrl()}/${drupalPath}${qs ? `?${qs}` : ''}`

  const headers: Record<string, string> = {
    Accept: req.headers['accept'] ?? 'application/json',
  }

  const sessionCookie = token.drupalSessionCookie as string | undefined
  if (sessionCookie) headers['Cookie'] = sessionCookie

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    headers['Content-Type'] = req.headers['content-type'] ?? 'application/json'
    const csrfToken = token.csrfToken as string | undefined
    if (csrfToken) headers['X-CSRF-Token'] = csrfToken
    if (req.headers['content-disposition']) {
      headers['Content-Disposition'] = req.headers['content-disposition'] as string
    }
  }

  try {
    const body = req.method !== 'GET' && req.method !== 'HEAD'
      ? await readBody(req)
      : undefined

    console.log(`[drupal-proxy] ${req.method} ${url}`)
    const drupalRes = await fetch(url, { method: req.method, headers, body: body ? new Uint8Array(body) : undefined })
    console.log(`[drupal-proxy] → ${drupalRes.status}`)

    if (drupalRes.status === 403) {
      return res.status(401).json({ error: 'Session expired' })
    }

    if (drupalRes.status >= 500) {
      return res.status(502).json({ error: 'Service unavailable' })
    }

    const data = Buffer.from(await drupalRes.arrayBuffer())
    drupalRes.headers.forEach((value, key) => {
      if (!['transfer-encoding', 'connection', 'set-cookie', 'www-authenticate'].includes(key.toLowerCase())) {
        res.setHeader(key, value)
      }
    })
    return res.status(drupalRes.status).send(data)
  } catch (err) {
    if (err instanceof Error && 'statusCode' in err) {
      const statusCode = (err as Record<string, unknown>).statusCode
      if (statusCode === 413) {
        return res.status(413).json({ error: 'Payload too large' })
      }
    }
    return res.status(502).json({ error: 'Service unavailable' })
  }
}

const MAX_BODY_BYTES = 10 * 1024 * 1024 // 10 MB

function readBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let totalBytes = 0
    req.on('data', (chunk: Buffer) => {
      totalBytes += chunk.length
      if (totalBytes > MAX_BODY_BYTES) {
        req.destroy()
        reject(Object.assign(new Error('Payload too large'), { statusCode: 413 }))
        return
      }
      chunks.push(Buffer.from(chunk))
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}
