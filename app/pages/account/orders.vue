<script setup lang="ts">
import type { OrderView } from '#shared/types/order'
import type { PaginatedResult } from '#shared/types/catalog'

definePageMeta({ middleware: 'auth' })

const { data } = await useFetch<PaginatedResult<OrderView>>('/api/orders', {
  key: 'my-orders',
  query: { limit: 50 },
})

useSeoMeta({ title: 'Đơn hàng của tôi - Cá Nhà Biển' })
</script>

<template>
  <UContainer class="py-8">
    <h1 class="mb-6 text-2xl font-bold text-highlighted">
      Đơn hàng của tôi
    </h1>
    <div class="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
      <AccountNav />

      <div>
        <div v-if="!data?.data.length" class="rounded-xl border border-dashed border-default py-16 text-center">
          <p class="text-muted">
            Bạn chưa có đơn hàng nào.
          </p>
          <UButton class="mt-4" to="/products">
            Mua sắm ngay
          </UButton>
        </div>

        <div v-else class="space-y-3">
          <NuxtLink
            v-for="order in data.data"
            :key="order.id"
            :to="`/order/${order.id}`"
            class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-default p-4 transition hover:shadow-md"
          >
            <div>
              <p class="font-medium text-highlighted">
                {{ order.orderNumber }}
              </p>
              <p class="text-xs text-muted">
                {{ new Date(order.createdAt).toLocaleString('vi-VN') }} · {{ order.items.length }} sản phẩm
              </p>
            </div>
            <div class="flex items-center gap-3">
              <span class="font-semibold text-primary">{{ formatVnd(order.total) }}</span>
              <UBadge v-if="order.depositPercent" color="warning" variant="subtle">
                Cọc {{ order.depositPercent }}%
              </UBadge>
              <UBadge :color="orderStatusColors[order.status]">
                {{ orderStatusLabels[order.status] }}
              </UBadge>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </UContainer>
</template>
