<script setup lang="ts">
const cartStore = useCartStore()
await cartStore.ensureLoaded()

const toast = useToast()
const updatingId = ref<string | null>(null)

async function changeQuantity(itemId: string, quantity: number) {
  if (quantity < 1) return
  updatingId.value = itemId
  try {
    await cartStore.updateItem(itemId, quantity)
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể cập nhật số lượng'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    updatingId.value = null
  }
}

async function removeItem(itemId: string) {
  updatingId.value = itemId
  try {
    await cartStore.removeItem(itemId)
  } finally {
    updatingId.value = null
  }
}

const hasUnavailableItems = computed(() => cartStore.cart?.items.some(i => !i.available) ?? false)
const canCheckout = computed(() => (cartStore.cart?.items.length ?? 0) > 0 && !hasUnavailableItems.value)

useSeoMeta({ title: 'Giỏ hàng - Cá nhà biển' })
</script>

<template>
  <UContainer class="py-8">
    <h1 class="mb-6 text-2xl font-bold text-highlighted">
      Giỏ hàng
    </h1>

    <div v-if="!cartStore.cart?.items.length" class="rounded-xl border border-dashed border-default py-20 text-center">
      <UIcon name="i-lucide-shopping-cart" class="mx-auto size-12 text-muted" />
      <p class="mt-3 text-muted">
        Giỏ hàng của bạn đang trống.
      </p>
      <UButton class="mt-4" to="/products">
        Tiếp tục mua sắm
      </UButton>
    </div>

    <div v-else class="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
      <div class="space-y-4">
        <div
          v-for="item in cartStore.cart.items"
          :key="item.id"
          class="flex gap-4 rounded-xl border border-default p-4"
          :class="{ 'opacity-60': !item.available }"
        >
          <NuxtLink :to="`/products/${item.product.slug}`" class="size-20 shrink-0 overflow-hidden rounded-lg bg-elevated">
            <img
              :src="item.product.image ?? '/images/placeholder-fish.svg'"
              :alt="item.product.name"
              class="size-full object-cover"
            >
          </NuxtLink>

          <div class="flex flex-1 flex-col">
            <div class="flex items-start justify-between gap-2">
              <div>
                <NuxtLink :to="`/products/${item.product.slug}`" class="font-medium text-highlighted hover:text-primary">
                  {{ item.product.name }}
                </NuxtLink>
                <p class="text-xs text-muted">
                  {{ item.unit }}
                </p>
              </div>
              <UButton
                icon="i-lucide-trash-2"
                color="neutral"
                variant="ghost"
                size="sm"
                :loading="updatingId === item.id"
                @click="removeItem(item.id)"
              />
            </div>

            <p v-if="!item.available" class="mt-1 text-xs text-error">
              {{ item.stock === 0 ? 'Sản phẩm đã hết hàng' : `Chỉ còn ${item.stock} sản phẩm, vui lòng điều chỉnh số lượng` }}
            </p>

            <div class="mt-auto flex items-center justify-between pt-2">
              <UInputNumber
                :model-value="item.quantity"
                :min="1"
                :max="Math.max(item.stock, 1)"
                size="sm"
                class="w-28"
                :disabled="updatingId === item.id"
                @update:model-value="(q: number) => changeQuantity(item.id, q)"
              />
              <div class="text-right">
                <p class="font-semibold text-highlighted">
                  {{ formatVnd(item.lineTotal) }}
                </p>
                <p class="text-xs text-muted">
                  {{ formatVnd(item.price) }} / {{ item.unit }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="h-fit rounded-xl border border-default p-5">
        <h2 class="mb-4 font-semibold text-highlighted">
          Tóm tắt đơn hàng
        </h2>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-muted">Tạm tính</span>
            <span>{{ formatVnd(cartStore.cart.subtotal) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted">Phí giao hàng</span>
            <span>{{ Number(cartStore.cart.shippingFee) === 0 ? 'Miễn phí' : formatVnd(cartStore.cart.shippingFee) }}</span>
          </div>
          <USeparator />
          <div class="flex justify-between text-base font-semibold text-highlighted">
            <span>Tổng cộng</span>
            <span class="text-primary">{{ formatVnd(cartStore.cart.total) }}</span>
          </div>
        </div>

        <p v-if="hasUnavailableItems" class="mt-3 text-xs text-error">
          Vui lòng xử lý các sản phẩm hết hàng trước khi thanh toán.
        </p>

        <UButton class="mt-4" size="lg" block :disabled="!canCheckout" to="/checkout">
          Tiến hành thanh toán
        </UButton>
      </div>
    </div>
  </UContainer>
</template>
