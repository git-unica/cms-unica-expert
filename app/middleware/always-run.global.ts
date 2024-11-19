export default defineNuxtRouteMiddleware(async (to) => {
  if (['login'].includes(to.name.toString())) return

  const authStore = useAuthStore()
  const { isLogin } = storeToRefs(authStore)
  if (isLogin.value) {
    await authStore.getUserInfo()
  } else {
    return navigateTo('/login')
  }
})
