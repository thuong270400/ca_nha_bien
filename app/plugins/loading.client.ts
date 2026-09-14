/**
 * Drives the global loading overlay (`AppLoadingOverlay.vue` + `useAppLoading`):
 * - page navigations, via Nuxt's `page:start`/`page:finish` hooks (fired around the
 *   route's Suspense boundary, so it covers async page setup/data too).
 * - API calls, by patching `window.fetch` to bump the counter around any `/api/**`
 *   request. This is done at the `fetch()` level rather than overriding the global
 *   `$fetch` because Nuxt's auto-imported `$fetch`/`useFetch`/`useRequestFetch` all
 *   capture a reference to the ofetch instance at module-load time (before any plugin
 *   runs), so reassigning `globalThis.$fetch` later would not affect them. ofetch's
 *   own fetch call re-reads `globalThis.fetch` on every request, so patching it here
 *   reliably covers `$fetch`, `useFetch`, and `useRequestFetch` alike.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const { start, finish } = useAppLoading()

  nuxtApp.hook('page:start', () => start())
  nuxtApp.hook('page:finish', () => finish())

  const originalFetch = window.fetch.bind(window)
  window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const isApiCall = url.includes('/api/')

    if (isApiCall) start()
    try {
      return await originalFetch(input, init)
    } finally {
      if (isApiCall) finish()
    }
  }) as typeof window.fetch
})
