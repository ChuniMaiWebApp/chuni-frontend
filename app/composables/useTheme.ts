export type ThemePreference = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'chunithmqueue:theme'

/**
 * Light/dark preference, applied as `data-theme` on the document element.
 *
 * The mechanism only — which colours each theme uses lives in CSS. Three
 * states rather than a boolean, because "follow the system" is a real choice
 * and collapsing it into a toggle loses it the moment the OS switches.
 *
 * Dark is the default when the system says nothing: the app is mostly opened
 * standing in a dim arcade.
 */
export const useTheme = () => {
  const preference = useState<ThemePreference>('theme', () => 'system')

  /** What is actually on screen once `system` has been resolved. */
  const resolved = computed<'light' | 'dark'>(() => {
    if (preference.value !== 'system') return preference.value
    if (!import.meta.client) return 'dark'

    return window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark'
  })

  const apply = () => {
    if (!import.meta.client) return

    // `system` leaves the attribute off entirely so the CSS media query is
    // what decides — no JavaScript in the path for the common case.
    if (preference.value === 'system') {
      document.documentElement.removeAttribute('data-theme')
    }
    else {
      document.documentElement.setAttribute('data-theme', preference.value)
    }
  }

  const set = (value: ThemePreference) => {
    preference.value = value

    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, value)
      apply()
    }
  }

  /** Reads the stored choice. Called once, from the theme plugin. */
  const restore = () => {
    if (!import.meta.client) return

    const stored = localStorage.getItem(STORAGE_KEY)

    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      preference.value = stored
    }

    apply()
  }

  /** Cycles system → light → dark → system, for a single-button control. */
  const cycle = () => {
    const order: ThemePreference[] = ['system', 'light', 'dark']
    const next = order[(order.indexOf(preference.value) + 1) % order.length]!

    set(next)
  }

  return { preference, resolved, set, cycle, restore }
}
