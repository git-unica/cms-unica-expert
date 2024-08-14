export default defineNuxtRouteMiddleware(async (to) => {
  if (['login'].includes(to.name.toString())) return

  const authStore = useAuthStore()
  const { isLogin, refreshToken } = storeToRefs(authStore)
  if (!isLogin.value) {
    if (!refreshToken.value) return navigateTo('/login')

    try {
      await useReLogin()
      await authStore.getUserInfo()
    } catch (e) {
      console.log(e)
      authStore.setRefreshToken(undefined)

      return navigateTo('/login')
    }
  }
})
