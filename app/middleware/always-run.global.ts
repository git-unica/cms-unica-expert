export default defineNuxtRouteMiddleware(async (to) => {
  if (['login'].includes(to.name.toString())) return

  const authStore = useAuthStore()
  const { isLogin, refreshToken } = storeToRefs(authStore)
  const { session } = useNestSession()
  if (!isLogin.value && session.value?.isAuthenticated) {
    await useSessionToStore()
  }

  if (!isLogin.value && !session.value?.isAuthenticated) {
    if (refreshToken.value) {
      try {
        await useReLogin(refreshToken.value)
        return
      } catch (e) {
        console.log(e)
        await authStore.logout()
      }
    }

    return navigateTo('/login')
  }
})
