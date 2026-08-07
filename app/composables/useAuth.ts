import type { LoginCode, LoginStatus, SessionUser } from '~~/shared/types/api'

/**
 * Signed-in player, shared across the app.
 *
 * `useState` keeps the value across route changes and transfers it from SSR to
 * the client, so `/profile` does not have to re-ask who you are on every hop.
 */
export const useAuth = () => {
  const user = useState<SessionUser | null>('auth:user', () => null)
  const api = useApi()

  /** Re-reads the session. Returns null when the cookie is missing or stale. */
  const refresh = async (): Promise<SessionUser | null> => {
    try {
      user.value = await api<SessionUser>('/auth/me')
    }
    catch {
      user.value = null
    }

    return user.value
  }

  /**
   * Signs in with a SEGA ID.
   *
   * The password goes straight to the API and is not kept anywhere on the
   * client — no local storage, no state, no query string.
   */
  const signIn = async (
    username: string,
    password: string,
  ): Promise<SessionUser> => {
    const result = await api<{ user: SessionUser }>('/auth/login', {
      method: 'POST',
      body: { username, password },
    })

    user.value = result.user

    return result.user
  }

  /** Links an account from a clal cookie the player pasted in. */
  const linkWithClal = async (clal: string): Promise<SessionUser> => {
    const result = await api<{ user: SessionUser }>('/auth/link', {
      method: 'POST',
      body: { clal },
    })

    user.value = result.user

    return result.user
  }

  const startBookmarkletLogin = () =>
    api<LoginCode>('/auth/login/code', { method: 'POST' })

  const pollBookmarkletLogin = (pollToken: string) =>
    api<LoginStatus>('/auth/login/status', { query: { pollToken } })

  const logout = async (invalidateRemote = false): Promise<void> => {
    await api('/auth/logout', {
      method: 'POST',
      body: { invalidateRemote },
    })

    user.value = null
  }

  return {
    user,
    isSignedIn: computed(() => user.value !== null),
    refresh,
    signIn,
    linkWithClal,
    startBookmarkletLogin,
    pollBookmarkletLogin,
    logout,
  }
}
