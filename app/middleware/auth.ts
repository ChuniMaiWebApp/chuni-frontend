/**
 * Guards pages that need a linked CHUNITHM-NET account.
 *
 * Apply with `definePageMeta({ middleware: 'auth' })`.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { user, refresh } = useAuth()

  if (!user.value) await refresh()

  if (!user.value) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
})
