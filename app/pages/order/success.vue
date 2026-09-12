<script setup lang="ts">
import type { OrderView } from '#shared/types/order'

const route = useRoute()
const orderId = route.query.id as string | undefined

const { data: order } = await useFetch<OrderView>(
  () => `/api/orders/${orderId}`,
  { key: `order-${orderId}`, immediate: Boolean(orderId) },
)

if (!orderId) {
  await navigateTo('/')
}

useSeoMeta({ title: 'Đặt hàng thành công - Cá Nhà Biển' })
</script>

<template>
  <UContainer class="flex min-h-[70vh] flex-col items-center justify-center py-12 text-center">
    <UIcon name="i-lucide-circle-check-big" class="size-16 text-success" />
    <h1 class="mt-4 text-2xl font-bold text-highlighted">
      Đặt hàng thành công!
    </h1>
    <p v-if="order" class="mt-2 text-muted">
      Mã đơn hàng <span class="font-medium text-highlighted">{{ order.orderNumber }}</span>.
      Chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất.
    </p>
    <p v-if="order" class="mt-1 text-lg font-semibold text-primary">
      {{ formatVnd(order.total) }}
    </p>

    <div class="mt-6 flex gap-3">
      <UButton v-if="order" :to="`/order/${order.id}`" variant="outline">
        Xem chi tiết đơn hàng
      </UButton>
      <UButton to="/products">
        Tiếp tục mua sắm
      </UButton>
    </div>
  </UContainer>
</template>
