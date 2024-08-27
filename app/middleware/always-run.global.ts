export default defineNuxtRouteMiddleware(async (to) => {
  if (['login'].includes(to.name.toString())) return

  const authStore = useAuthStore()
  const { isLogin, refreshToken } = storeToRefs(authStore)
  const { session } = useNestSession()
  if (!isLogin.value && !session.value.isAuthenticated && refreshToken.value) {
    try {
      await useReLogin(refreshToken.value)
    } catch (e) {
      await authStore.logout()
      navigateTo('/login')
    }
  }
})
