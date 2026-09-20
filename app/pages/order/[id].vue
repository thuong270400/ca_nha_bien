<script setup lang="ts">
import type { OrderView } from '#shared/types/order'
import { formatDays, groupByAvailabilityDays } from '#shared/utils/sourcing'

const route = useRoute()
const id = route.params.id as string

const { data: order, refresh } = await useFetch<OrderView>(`/api/orders/${id}`, { key: `order-${id}` })

if (!order.value) {
  throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy đơn hàng', fatal: true })
}

// Webhook SePay tự xác nhận khi nhận được chuyển khoản (server/api/webhooks/sepay.post.ts);
// polling nhẹ ở đây để khách tự thấy cập nhật mà không cần refresh tay. Đơn có
// tách cọc (payment.depositAmount) cần chờ qua cả 2 bước PENDING -> DEPOSIT_PAID
// -> PAID nên vẫn phải poll khi đang ở DEPOSIT_PAID (chờ chuyển nốt phần còn lại).
const { pause, resume } = useIntervalFn(() => refresh(), 5000, { immediate: false })
watchEffect(() => {
  if (order.value?.paymentMethod === 'BANK_TRANSFER' && (order.value?.paymentStatus === 'PENDING' || order.value?.paymentStatus === 'DEPOSIT_PAID')) {
    resume()
  } else {
    pause()
  }
})

// Nhóm sản phẩm theo số ngày dự kiến có cá khi khách đã chọn "giao nhiều
// lần" ở checkout (Order.deliveryMode) — xem shared/utils/sourcing.ts.
const itemGroups = computed(() => order.value ? groupByAvailabilityDays(order.value.items) : [])

// Số tiền cần chuyển ở bước hiện tại — cọc trước (PENDING) hoặc phần còn lại
// (DEPOSIT_PAID) nếu đơn có tách cọc, hoặc cả đơn (PENDING, không tách cọc).
const remainingAmount = computed(() => {
  if (!order.value?.payment?.depositAmount) return null
  return Number(order.value.total) - Number(order.value.payment.depositAmount)
})
const qrAmount = computed(() => {
  const payment = order.value?.payment
  if (!payment) return null
  if (payment.status === 'PENDING') return payment.depositAmount ? Number(payment.depositAmount) : Number(payment.amount)
  if (payment.status === 'DEPOSIT_PAID') return remainingAmount.value
  return null
})

const qrImageUrl = computed(() => {
  if (!order.value?.payment?.bankSnapshot || qrAmount.value === null) return null
  return buildVietQrImageUrl(order.value.payment.bankSnapshot, {
    amount: qrAmount.value,
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
          <div class="mb-4 flex items-center justify-between gap-2">
            <h2 class="font-semibold text-highlighted">
              Sản phẩm
            </h2>
            <UBadge v-if="order.deliveryMode === 'SPLIT'" color="primary" variant="subtle">
              Giao nhiều lần ({{ itemGroups.length }} đợt)
            </UBadge>
          </div>

          <template v-if="order.deliveryMode === 'SPLIT'">
            <div v-for="(group, idx) in itemGroups" :key="idx" class="mb-4 last:mb-0">
              <p class="mb-2 flex items-center gap-1 text-xs font-medium text-primary">
                <UIcon name="i-lucide-package" class="size-3.5" /> Đợt {{ idx + 1 }} — dự kiến có cá trong {{ formatDays(group.days) }}
              </p>
              <div class="space-y-2">
                <div v-for="item in group.items" :key="item.id" class="flex justify-between text-sm">
                  <span class="text-muted">{{ item.productName }} ({{ item.unit }}) × {{ item.quantity }}</span>
                  <span class="font-medium">{{ formatVnd(item.lineTotal) }}</span>
                </div>
              </div>
            </div>
          </template>
          <div v-else class="space-y-3">
            <div v-for="item in order.items" :key="item.id" class="flex justify-between text-sm">
              <span class="text-muted">{{ item.productName }} ({{ item.unit }}) × {{ item.quantity }}</span>
              <span class="font-medium">{{ formatVnd(item.lineTotal) }}</span>
            </div>
          </div>

          <p v-if="order.depositPercent && order.paymentMethod !== 'BANK_TRANSFER'" class="mt-4 flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-sm text-warning">
            <UIcon name="i-lucide-circle-alert" class="mt-0.5 size-4 shrink-0" />
            <span>Đơn hàng cần đặt cọc trước {{ order.depositPercent }}%, chúng tôi sẽ liên hệ để xác nhận cọc.</span>
          </p>
          <p v-if="order.estimatedAvailabilityDays" class="mt-2 flex items-center gap-2 text-sm text-muted">
            <UIcon name="i-lucide-clock" class="size-4 shrink-0" />
            <span>Dự kiến giao hàng trong khoảng {{ order.estimatedAvailabilityDays }} ngày</span>
          </p>
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
            v-if="order.paymentMethod === 'BANK_TRANSFER' && (order.paymentStatus === 'PENDING' || order.paymentStatus === 'DEPOSIT_PAID')"
            class="mt-4 rounded-lg border border-dashed border-default p-4 text-center"
          >
            <template v-if="qrImageUrl">
              <p v-if="order.paymentStatus === 'DEPOSIT_PAID'" class="mb-2 flex items-center justify-center gap-1 text-sm text-success">
                <UIcon name="i-lucide-check-circle" class="size-4" /> Đã nhận cọc {{ formatVnd(order.payment?.depositAmount ?? 0) }}
              </p>
              <img :src="qrImageUrl" alt="QR chuyển khoản VietQR" class="mx-auto w-56 rounded-lg border border-default">
              <p class="mt-3 text-sm text-muted">
                <template v-if="order.paymentStatus === 'DEPOSIT_PAID'">
                  Quét mã QR để chuyển nốt {{ formatVnd(remainingAmount ?? 0) }} còn lại. Đơn hàng sẽ tự động được xác nhận sau khi hệ thống nhận được tiền (thường trong ít phút).
                </template>
                <template v-else-if="order.payment?.depositAmount">
                  Quét mã QR để chuyển khoản cọc trước {{ formatVnd(order.payment.depositAmount) }} (đơn hàng {{ formatVnd(order.total) }}, còn lại {{ formatVnd(remainingAmount ?? 0) }} thu sau).
                </template>
                <template v-else>
                  Quét mã QR bằng app ngân hàng để chuyển khoản. Đơn hàng sẽ tự động được xác nhận sau khi hệ thống nhận được tiền (thường trong ít phút).
                </template>
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
