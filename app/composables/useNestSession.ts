interface AuthenticatedNestSession {
  isAuthenticated: true
  userId: string
}

interface UnauthenticatedNestSession {
  isAuthenticated: false
  userId?: undefined
}

interface UnknownNestSession {
  isAuthenticated?: undefined
  userId?: undefined
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
    headers: useRequestHeaders(['cookie'])
  })
}

async function clear() {
  await $fetch('/api/v1/auth/session', {
    method: 'DELETE',
    headers: useRequestHeaders(['cookie'])
  })

  useSessionState().value = undefined
}
