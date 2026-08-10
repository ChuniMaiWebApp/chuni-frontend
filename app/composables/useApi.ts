import type { UseFetchOptions } from 'nuxt/app'

/**
 * The session lives in an httpOnly cookie set by the API. During SSR the Nuxt
 * server has to forward that cookie by hand, otherwise the first render is
 * always signed out and the page flickers on hydration.
 *
 * This is why the API sets COOKIE_DOMAIN=.novaseele.com in production: the app
 * and the API are separate hosts there, and a host-only cookie would never
 * reach the document request that Nuxt renders from.
 */
const sessionHeaders = () =>
  import.meta.server ? useRequestHeaders(['cookie']) : {}

/**
 * Where to send API calls from the current side.
 *
 * The browser uses the public origin. The server uses loopback, so a
 * server-rendered page does not travel out to Cloudflare and back in to reach
 * a process on the same machine — slower, and it would make SSR depend on the
 * CDN being reachable from inside the VPS. Same API, two routes to it.
 */
const apiBaseUrl = (): string => {
  const config = useRuntimeConfig()

  return import.meta.server ? config.apiBaseServer : config.public.apiBase
}

/**
 * `$fetch` instance pointed at the backend, for imperative calls in event
 * handlers. For data that should render during SSR use `useApiFetch`.
 */
export const useApi = () => {
  return $fetch.create({
    baseURL: apiBaseUrl(),
    credentials: 'include',
    headers: sessionHeaders(),
  })
}

/**
 * Cache key for a request, deliberately independent of `baseURL`.
 *
 * `useFetch` hashes its options — including baseURL — to key the payload it
 * hands from server to client. Since the two sides now use different bases,
 * the generated keys would not match: the client would find no payload for the
 * data the server already fetched and would request everything a second time
 * on hydration. Keying on what actually identifies the request keeps one fetch.
 */
const requestKey = (
  url: string | (() => string),
  options: { query?: unknown, params?: unknown },
): string => {
  const path = typeof url === 'function' ? url() : url
  const query = unref(options.query) ?? unref(options.params)

  return `api:${path}:${query ? JSON.stringify(query) : ''}`
}

/**
 * SSR friendly wrapper around `useFetch` that targets the backend API.
 *
 * Options are `useFetch`'s, not `$fetch`'s: passing `immediate` or `watch`
 * through a `$fetch` option type made every extra key a excess-property error,
 * which in turn collapsed `data` to `unknown` and silently dropped type safety
 * from every page that used them.
 *
 * @example
 * const { data } = await useApiFetch<Profile>('/chunithm/profile')
 */
export const useApiFetch = <T>(
  url: string | (() => string),
  options: UseFetchOptions<T> = {},
) => {
  const opts = options as UseFetchOptions<T> & {
    key?: string
    query?: unknown
    params?: unknown
  }

  return useFetch(url, {
    baseURL: apiBaseUrl(),
    credentials: 'include',
    ...options,
    // After the spread: an `options` object carrying `key: undefined` would
    // otherwise erase the computed one and put us back to two fetches.
    key: opts.key ?? requestKey(url, opts),
    headers: {
      ...sessionHeaders(),
      ...(options.headers as Record<string, string> | undefined),
    },
  } as UseFetchOptions<T>) as ReturnType<typeof useFetch<T>>
}
