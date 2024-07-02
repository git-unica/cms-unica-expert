export default defineNuxtRouteMiddleware(async (to) => {
  if (['login'].includes(to.name.toString())) return

  const authStore = useAuthStore()
  const { isLogin, refreshToken } = storeToRefs(authStore)
  if (!isLogin.value) {
    if (!refreshToken.value) return navigateTo('/login')

    try {
      const res = await useReLogin()
      authStore.setAccessToken(res.access_token)
      authStore.setRefreshToken(res.refresh_token)
      await authStore.getUserInfo()
    } catch (e) {
      console.log(e)
      authStore.setRefreshToken(undefined)

      return navigateTo('/login')
    }
  }
})
