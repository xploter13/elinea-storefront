export default defineNuxtRouteMiddleware(async (to) => {
  try {
    await useRequestFetch()('/api/auth/me')
  } catch {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
})
