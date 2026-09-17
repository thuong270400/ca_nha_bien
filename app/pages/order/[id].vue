<script setup lang="ts">
import type { OrderView } from '#shared/types/order'

const route = useRoute()
const id = route.params.id as string

const { data: order, refresh } = await useFetch<OrderView>(`/api/orders/${id}`, { key: `order-${id}` })

if (!order.value) {
  throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy đơn hàng', fatal: true })
}

// Webhook SePay tự xác nhận khi nhận được chuyển khoản (server/api/webhooks/sepay.post.ts);
// polling nhẹ ở đây để khách tự thấy cập nhật mà không cần refresh tay.
const { pause, resume } = useIntervalFn(() => refresh(), 5000, { immediate: false })
watchEffect(() => {
  if (order.value?.paymentMethod === 'BANK_TRANSFER' && order.value?.paymentStatus === 'PENDING') {
    resume()
  } else {
    pause()
  }
})

const qrImageUrl = computed(() => {
  if (!order.value?.payment?.bankSnapshot) return null
  return buildVietQrImageUrl(order.value.payment.bankSnapshot, {
    amount: Number(order.value.total),
    addInfo: order.value.orderNumber,
  })
})

useSeoMeta({ title: () => `Đơn hàng ${order.value?.orderNumber} - Cá Nhà Biển` })
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
          <div class="mb-3 flex items-center justify-between gap-2">
            <h2 class="font-semibold text-highlighted">
              Thanh toán
            </h2>
            <UBadge :color="paymentStatusColors[order.paymentStatus]" variant="subtle">
              {{ paymentStatusLabels[order.paymentStatus] }}
            </UBadge>
          </div>
          <p class="text-sm text-muted">
            {{ paymentMethodLabels[order.paymentMethod] }}
          </p>

          <div
            v-if="order.paymentMethod === 'BANK_TRANSFER' && order.paymentStatus === 'PENDING'"
            class="mt-4 rounded-lg border border-dashed border-default p-4 text-center"
          >
            <template v-if="qrImageUrl">
              <img :src="qrImageUrl" alt="QR chuyển khoản VietQR" class="mx-auto w-56 rounded-lg border border-default">
              <p class="mt-3 text-sm text-muted">
                Quét mã QR bằng app ngân hàng để chuyển khoản. Đơn hàng sẽ tự động được xác nhận sau khi hệ thống nhận được tiền (thường trong ít phút).
              </p>
              <p v-if="order.payment?.bankSnapshot?.bankAccountNumber" class="mt-2 text-sm">
                {{ order.payment.bankSnapshot.bankName }} · {{ order.payment.bankSnapshot.bankAccountNumber }} · {{ order.payment.bankSnapshot.bankAccountName }}
              </p>
              <UButton class="mt-3" variant="soft" size="sm" @click="refresh()">
                Tôi đã chuyển khoản, kiểm tra lại
              </UButton>
            </template>
            <p v-else class="text-sm text-muted">
              Không thể hiển thị mã QR (thiếu thông tin ngân hàng), vui lòng liên hệ để được hỗ trợ.
            </p>
          </div>

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
