import type { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt'
import { getDrupalBaseUrl } from '@/config/drupal'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const token = await getToken({ req })

  if (token?.drupalSessionCookie) {
    try {
      await fetch(`${getDrupalBaseUrl()}/user/logout?_format=json`, {
        method: 'POST',
        headers: {
          Cookie: token.drupalSessionCookie as string,
          'X-CSRF-Token': (token.logoutToken as string) ?? '',
        },
      })
    } catch {
      // Drupal logout failed — proceed with local signout anyway
    }
  }

  return res.status(200).json({ ok: true })
}
