export default defineNuxtRouteMiddleware(async (to) => {
  if (['login'].includes(to.name.toString())) return
})
