import { defineStore } from 'pinia'

export const useWishlistStore = defineStore('wishlist', () => {
  const ids = ref<Set<string>>(new Set())
  const initialized = ref(false)

  async function fetchIds() {
    const { loggedIn } = useUserSession()
    if (!loggedIn.value) {
      ids.value = new Set()
      initialized.value = true
      return
    }
    // Plain global $fetch does not forward the incoming request's cookies during SSR — see stores/cart.ts.
    const productIds = await useRequestFetch()<string[]>('/api/wishlist/product-ids')
    ids.value = new Set(productIds)
    initialized.value = true
  }

  async function ensureLoaded() {
    if (!initialized.value) await fetchIds()
  }

  function has(productId: string) {
    return ids.value.has(productId)
  }

  async function toggle(productId: string) {
    const wasWishlisted = ids.value.has(productId)
    if (wasWishlisted) ids.value.delete(productId)
    else ids.value.add(productId)
    // trigger reactivity for Set mutation
    ids.value = new Set(ids.value)

    try {
      if (wasWishlisted) {
        await useRequestFetch()(`/api/wishlist/${productId}`, { method: 'DELETE' })
      } else {
        await useRequestFetch()('/api/wishlist', { method: 'POST', body: { productId } })
      }
    } catch (err) {
      // rollback on failure
      if (wasWishlisted) ids.value.add(productId)
      else ids.value.delete(productId)
      ids.value = new Set(ids.value)
      throw err
    }
  }

  return { ids, initialized, ensureLoaded, has, toggle }
})
