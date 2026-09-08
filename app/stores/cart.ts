import { defineStore } from 'pinia'
import type { CartView } from '#shared/types/cart'

export const useCartStore = defineStore('cart', () => {
  const cart = ref<CartView | null>(null)
  const loading = ref(false)
  const initialized = ref(false)

  async function fetchCart() {
    loading.value = true
    try {
      // Plain global $fetch does not forward the incoming request's cookies during SSR
      // (guest_cart_id would look empty on first render) — useRequestFetch() does.
      cart.value = await useRequestFetch()<CartView>('/api/cart')
      initialized.value = true
    } finally {
      loading.value = false
    }
  }

  async function ensureLoaded() {
    if (!initialized.value) await fetchCart()
  }

  async function addItem(variantId: string, quantity = 1) {
    cart.value = await useRequestFetch()<CartView>('/api/cart/items', {
      method: 'POST',
      body: { variantId, quantity },
    })
    initialized.value = true
  }

  async function updateItem(itemId: string, quantity: number) {
    cart.value = await useRequestFetch()<CartView>(`/api/cart/items/${itemId}`, {
      method: 'PATCH',
      body: { quantity },
    })
  }

  async function removeItem(itemId: string) {
    cart.value = await useRequestFetch()<CartView>(`/api/cart/items/${itemId}`, { method: 'DELETE' })
  }

  const itemCount = computed(() => cart.value?.itemCount ?? 0)

  return { cart, loading, initialized, itemCount, fetchCart, ensureLoaded, addItem, updateItem, removeItem }
})
