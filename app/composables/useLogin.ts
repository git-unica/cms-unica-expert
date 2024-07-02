import type { IResponseLoginFail, IResponseLoginSuccess } from '~/types'

export const useLogin = (username: string, password: string) => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()
  const { accessToken } = storeToRefs(authStore)

  return $fetch<IResponseLoginSuccess | IResponseLoginFail>(`v1/auth/login`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken.value}`
    },
    baseURL: config.public.apiUrl,
    body: { username, password }
  })
}
