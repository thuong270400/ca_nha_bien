declare module '#auth-utils' {
  interface User {
    id: string
    email: string
    name: string
    role: 'CUSTOMER' | 'ADMIN'
  }

  interface UserSession {
    loggedInAt?: string
  }

  interface SecureSessionData {}
}

export {}
