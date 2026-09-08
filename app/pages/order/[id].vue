<script setup lang="ts">
import type { OrderView } from '#shared/types/order'

const route = useRoute()
const id = route.params.id as string

const { data: order } = await useFetch<OrderView>(`/api/orders/${id}`, { key: `order-${id}` })

if (!order.value) {
  throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy đơn hàng', fatal: true })
}

const paymentMethodLabels: Record<string, string> = {
  COD: 'Thanh toán khi nhận hàng (COD)',
  VNPAY: 'VNPay',
  MOMO: 'MoMo',
  ZALOPAY: 'ZaloPay',
}

useSeoMeta({ title: () => `Đơn hàng ${order.value?.orderNumber} - Cá nhà biển` })
</script>

<template>
  <UContainer v-if="order" class="py-8">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-highlighted">
          Đơn hàng {{ order.orderNumber }}
        </h1>
        <p class="text-sm text-muted">
          Đặt lúc {{ new Date(order.createdAt).toLocaleString('vi-VN') }}
        </p>
      </div>
      <UBadge :color="orderStatusColors[order.status]" size="lg">
        {{ orderStatusLabels[order.status] }}
      </UBadge>
    </div>

    <div class="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
      <div class="space-y-4">
        <div class="rounded-xl border border-default p-5">
          <h2 class="mb-4 font-semibold text-highlighted">
            Sản phẩm
          </h2>
          <div class="space-y-3">
            <div v-for="item in order.items" :key="item.id" class="flex justify-between text-sm">
              <span class="text-muted">{{ item.productName }} ({{ item.unit }}) × {{ item.quantity }}</span>
              <span class="font-medium">{{ formatVnd(item.lineTotal) }}</span>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-default p-5">
          <h2 class="mb-2 font-semibold text-highlighted">
            Địa chỉ giao hàng
          </h2>
          <p class="text-sm">
            {{ order.recipientName }} · {{ order.recipientPhone }}
          </p>
          <p class="text-sm text-muted">
            {{ order.addressLine }}, {{ order.ward }}, {{ order.district }}, {{ order.province }}
          </p>
          <p v-if="order.note" class="mt-1 text-sm text-muted">
            Ghi chú: {{ order.note }}
          </p>
        </div>
      </div>

      <div class="h-fit space-y-4">
        <div class="rounded-xl border border-default p-5">
          <h2 class="mb-3 font-semibold text-highlighted">
            Thanh toán
          </h2>
          <p class="text-sm text-muted">
            {{ paymentMethodLabels[order.paymentMethod] }}
          </p>
          <div class="mt-3 space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-muted">Tạm tính</span>
              <span>{{ formatVnd(order.subtotal) }}</span>
            </div>
            <div v-if="Number(order.discountAmount) > 0" class="flex justify-between text-success">
              <span>Giảm giá{{ order.couponCode ? ` (${order.couponCode})` : '' }}</span>
              <span>-{{ formatVnd(order.discountAmount) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted">Phí giao hàng</span>
              <span>{{ Number(order.shippingFee) === 0 ? 'Miễn phí' : formatVnd(order.shippingFee) }}</span>
            </div>
            <USeparator />
            <div class="flex justify-between text-base font-semibold text-highlighted">
              <span>Tổng cộng</span>
              <span class="text-primary">{{ formatVnd(order.total) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </UContainer>
</template>
