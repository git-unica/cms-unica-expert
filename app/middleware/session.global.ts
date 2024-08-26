export default defineNuxtRouteMiddleware(async () => {
  const authStore = useAuthStore()
  const { session } = useNestSession()

  if (session.value) {
    const { isAuthenticated, userId, accessToken, refreshToken }
      = session.value

    if (isAuthenticated) {
      authStore.setUserId(userId)
      authStore.setAccessToken(accessToken)
      authStore.setRefreshToken(refreshToken)
      await authStore.getUserInfo()
    }
  }
})
