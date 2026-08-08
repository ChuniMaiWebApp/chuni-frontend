/**
 * Applies the stored light/dark choice on the client.
 *
 * The stored preference cannot reach the server — it lives in localStorage —
 * so the first paint follows the system, and this corrects it if the player
 * chose otherwise. The inline script in `nuxt.config.ts` does the same thing
 * before paint; this keeps the reactive state in step with it.
 */
export default defineNuxtPlugin(() => {
  useTheme().restore()
})
