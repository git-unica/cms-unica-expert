export const useReLogin = (token: string) => {
  const { fetch } = useNestSession()

  return $fetch<{
    access_token: string
    refresh_token: string
  }>('/api/v1/auth/refresh', {
    method: 'POST',
    credentials: 'include',
    body: {
      refresh_token: token
    },
    async onResponse({ response }) {
      if (response.ok) await fetch()
    }
  })
}
