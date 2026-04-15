import NextAuth, { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { getDrupalBaseUrl } from '@/config/drupal'

export async function authorizeWithDrupal(
  credentials: Record<string, string | undefined> | undefined
) {
  const username = credentials?.username
  const password = credentials?.password
  if (!username || !password) return null

  const baseUrl = getDrupalBaseUrl()

  let res: Response
  try {
    res = await fetch(`${baseUrl}/user/login?_format=json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: username, pass: password }),
    })
  } catch {
    return null
  }

  if (!res.ok) return null

  const data = await res.json()
  const sessionCookie = res.headers.get('set-cookie') ?? ''

  return {
    id: String(data.current_user.uid),
    name: String(data.current_user.name),
    drupalSessionCookie: sessionCookie,
    csrfToken: String(data.csrf_token),
    logoutToken: String(data.logout_token),
    roles: data.current_user.roles as string[],
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Drupal',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: authorizeWithDrupal,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.drupalSessionCookie = user.drupalSessionCookie
        token.csrfToken = user.csrfToken
        token.logoutToken = user.logoutToken
        token.roles = user.roles
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.sub as string
      session.user.roles = token.roles as string[]
      return session
    },
  },
  pages: { signIn: '/login' },
}

export default NextAuth(authOptions)
