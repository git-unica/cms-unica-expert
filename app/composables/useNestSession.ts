interface AuthenticatedNestSession {
  isAuthenticated: true
  userId: string
  siteId?: string
  accessToken: string
  refreshToken: string
}

interface UnauthenticatedNestSession {
  isAuthenticated: false
  userId?: undefined
  siteId?: undefined
  accessToken?: undefined
  refreshToken?: undefined
}

interface UnknownNestSession {
  isAuthenticated?: undefined
  userId?: undefined
  siteId?: undefined
  accessToken?: undefined
  refreshToken?: undefined
}

type NestSession =
  | AuthenticatedNestSession
  | UnauthenticatedNestSession
  | UnknownNestSession

const useSessionState = () =>
  useState<NestSession | undefined>('nuxt-session', () => undefined)

export const useNestSession = () => {
  return {
    session: useSessionState(),
    fetch,
    clear
  }
}

async function fetch() {
  useSessionState().value = await $fetch('/api/v1/auth/session', {
    method: 'GET',
    credentials: 'include',
    headers: useRequestHeaders(['cookie'])
  })
}

async function clear() {
  await $fetch('/api/v1/auth/session', {
    method: 'DELETE',
    credentials: 'include',
    headers: useRequestHeaders(['cookie'])
  })

  useSessionState().value = undefined
}
