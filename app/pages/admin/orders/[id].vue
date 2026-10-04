<script setup lang="ts">
import type { OrderView } from '#shared/types/order'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const id = route.params.id as string

const { data: order, refresh } = await useFetch<OrderView>(`/api/orders/${id}`, { key: `admin-order-${id}` })

if (!order.value) {
  throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy đơn hàng', fatal: true })
}

useSeoMeta({ title: () => `Đơn hàng ${order.value?.orderNumber} - Cá Nhà Biển Admin` })
</script>

<template>
  <div v-if="order" class="p-4 sm:p-6">
    <AdminOrderDetail :order="order" @refresh="refresh()" />
  </div>
</template>
