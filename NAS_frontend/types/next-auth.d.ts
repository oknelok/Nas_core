import { DefaultSession, DefaultJWT } from 'next-auth'

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
      roles: string[]
    } & DefaultSession['user']
  }

  interface User {
    id: string
    name: string
    drupalSessionCookie: string
    csrfToken: string
    logoutToken: string
    roles: string[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    drupalSessionCookie: string
    csrfToken: string
    logoutToken: string
    roles: string[]
  }
}
