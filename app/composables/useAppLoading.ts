const pendingCount = ref(0)
const isVisible = ref(false)

const SHOW_DELAY_MS = 150
const MIN_VISIBLE_MS = 200

let showTimer: ReturnType<typeof setTimeout> | undefined
let hideTimer: ReturnType<typeof setTimeout> | undefined

// Debounced so a fast page nav / API call never flashes the overlay, and once
// shown it stays for a minimum stretch instead of flickering off instantly.
if (import.meta.client) {
  watch(pendingCount, (count) => {
    if (count > 0) {
      clearTimeout(hideTimer)
      hideTimer = undefined
      if (!isVisible.value && !showTimer) {
        showTimer = setTimeout(() => {
          isVisible.value = true
          showTimer = undefined
        }, SHOW_DELAY_MS)
      }
    } else {
      clearTimeout(showTimer)
      showTimer = undefined
      if (isVisible.value && !hideTimer) {
        hideTimer = setTimeout(() => {
          isVisible.value = false
          hideTimer = undefined
        }, MIN_VISIBLE_MS)
      }
    }
  })
}

/**
 * Global loading overlay state, driven by page navigations (`app/plugins/loading.client.ts`
 * hooks `page:start`/`page:finish`) and API calls (same plugin patches `window.fetch` for
 * any `/api/**` request). Uses a counter so overlapping navigations/requests don't hide
 * the overlay early when only one of them finishes.
 */
export function useAppLoading() {
  function start() {
    pendingCount.value++
  }

  function finish() {
    pendingCount.value = Math.max(0, pendingCount.value - 1)
  }

  return { isVisible, start, finish }
}
