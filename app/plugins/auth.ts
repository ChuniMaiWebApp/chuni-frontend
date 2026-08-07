/**
 * Restores the session once, before the first render.
 *
 * Without this the session was only read by the `auth` middleware, so public
 * pages rendered as if signed out: the header offered "Sign in" to a player
 * who was signed in, on the same page that told them they had a score on the
 * song. Running it on the server means the header is correct in the very first
 * HTML rather than flipping after hydration.
 */
export default defineNuxtPlugin(async () => {
  const { user, refresh } = useAuth()

  if (user.value) return

  await refresh()
})
