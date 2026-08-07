import type { UseFetchOptions } from 'nuxt/app'

/**
 * The session lives in an httpOnly cookie set by the API. During SSR the Nuxt
 * server has to forward that cookie by hand, otherwise the first render is
 * always signed out and the page flickers on hydration.
 */
const sessionHeaders = () =>
  import.meta.server ? useRequestHeaders(['cookie']) : {}

/**
 * `$fetch` instance pointed at the backend, for imperative calls in event
 * handlers. For data that should render during SSR use `useApiFetch`.
 */
export const useApi = () => {
  const { apiBase } = useRuntimeConfig().public

  return $fetch.create({
    baseURL: apiBase,
    credentials: 'include',
    headers: sessionHeaders(),
  })
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
  const { apiBase } = useRuntimeConfig().public

  return useFetch(url, {
    baseURL: apiBase,
    credentials: 'include',
    ...options,
    headers: {
      ...sessionHeaders(),
      ...(options.headers as Record<string, string> | undefined),
    },
  } as UseFetchOptions<T>) as ReturnType<typeof useFetch<T>>
}
