export const useReLogin = () => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()
  const { refreshToken } = storeToRefs(authStore)

  return $fetch<{ access_token: string, refresh_token: string }>(`v1/auth/refresh`, {
    method: 'POST',
    baseURL: config.public.apiUrl,
    credentials: 'include',
    body: {
      refresh_token: refreshToken.value
    }
  })
}
