<script setup lang="ts">
import type { OrderStatus, OrderView } from '#shared/types/order'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const id = route.params.id as string
const toast = useToast()

const { data: order, refresh } = await useFetch<OrderView>(`/api/orders/${id}`, { key: `admin-order-${id}` })

if (!order.value) {
  throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy đơn hàng', fatal: true })
}

const statusOptions: { label: string, value: OrderStatus }[] = [
  { label: 'Chờ xác nhận', value: 'PENDING' },
  { label: 'Đã xác nhận', value: 'CONFIRMED' },
  { label: 'Đang chuẩn bị', value: 'PROCESSING' },
  { label: 'Đang giao hàng', value: 'SHIPPING' },
  { label: 'Đã giao hàng', value: 'DELIVERED' },
  { label: 'Đã huỷ', value: 'CANCELLED' },
]

const updating = ref(false)
async function updateStatus(status: string) {
  updating.value = true
  try {
    await $fetch(`/api/orders/${id}`, { method: 'PATCH', body: { status } })
    toast.add({ title: 'Đã cập nhật trạng thái đơn hàng', color: 'success' })
    await refresh()
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể cập nhật trạng thái'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    updating.value = false
  }
}

const paymentMethodLabels: Record<string, string> = {
  COD: 'Thanh toán khi nhận hàng (COD)',
  VNPAY: 'VNPay',
  MOMO: 'MoMo',
  ZALOPAY: 'ZaloPay',
}

useSeoMeta({ title: () => `Đơn hàng ${order.value?.orderNumber} - Cá Nhà Biển Admin` })
</script>

<template>
  <div v-if="order" class="space-y-4 p-4 sm:p-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold text-highlighted">
          Đơn hàng {{ order.orderNumber }}
        </h1>
        <p class="text-sm text-muted">
          Đặt lúc {{ new Date(order.createdAt).toLocaleString('vi-VN') }}
        </p>
      </div>
      <USelect
        :model-value="order.status"
        :items="statusOptions"
        :loading="updating"
        class="w-52"
        @update:model-value="updateStatus"
      />
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      <div class="space-y-4">
        <UCard>
          <template #header>
            <h2 class="font-semibold text-highlighted">
              Sản phẩm
            </h2>
          </template>
          <div class="space-y-2">
            <div v-for="item in order.items" :key="item.id" class="flex justify-between text-sm">
              <span>{{ item.productName }} ({{ item.unit }}) × {{ item.quantity }}</span>
              <span class="font-medium">{{ formatVnd(item.lineTotal) }}</span>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="font-semibold text-highlighted">
              Khách hàng &amp; Địa chỉ giao hàng
            </h2>
          </template>
          <p class="text-sm">
            <span class="font-medium">{{ order.recipientName }}</span> · {{ order.recipientPhone }}
          </p>
          <p class="text-sm text-muted">
            {{ order.addressLine }}, {{ order.ward }}, {{ order.district }}, {{ order.province }}
          </p>
          <p v-if="order.note" class="mt-1 text-sm text-muted">
            Ghi chú: {{ order.note }}
          </p>
        </UCard>
      </div>

      <div class="space-y-4">
        <UCard>
          <template #header>
            <h2 class="font-semibold text-highlighted">
              Thanh toán
            </h2>
          </template>
          <p class="text-sm text-muted">
            {{ paymentMethodLabels[order.paymentMethod] }}
          </p>
          <div class="mt-3 space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-muted">Tạm tính</span>
              <span>{{ formatVnd(order.subtotal) }}</span>
            </div>
            <div v-for="c in order.coupons" :key="c.id" class="flex justify-between text-success">
              <span>Giảm giá ({{ c.couponCode }})</span>
              <span>-{{ formatVnd(c.discountAmount) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted">Phí giao hàng</span>
              <span>{{ formatVnd(order.shippingFee) }}</span>
            </div>
            <USeparator />
            <div class="flex justify-between text-base font-semibold text-highlighted">
              <span>Tổng cộng</span>
              <span class="text-primary">{{ formatVnd(order.total) }}</span>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
