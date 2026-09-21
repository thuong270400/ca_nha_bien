<script setup lang="ts">
import type { OrderStatus, OrderView } from '#shared/types/order'
import { formatDays, groupByAvailabilityDays } from '#shared/utils/sourcing'

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

// Nhóm sản phẩm theo số ngày dự kiến có hàng khi khách đã chọn "giao nhiều
// lần" ở checkout (Order.deliveryMode) — xem shared/utils/sourcing.ts.
const itemGroups = computed(() => order.value ? groupByAvailabilityDays(order.value.items) : [])

// Đơn có tách cọc (payment.depositAmount) xác nhận theo 2 bước tuần tự — nút
// bấm tay chỉ xác nhận ĐÚNG bước đang chờ (PENDING: cọc trước, DEPOSIT_PAID:
// phần còn lại), xem order.service.ts#confirmBankTransferPayment.
const remainingAmount = computed(() => {
  if (!order.value?.payment?.depositAmount) return null
  return Number(order.value.total) - Number(order.value.payment.depositAmount)
})
const confirmButtonLabel = computed(() => {
  if (order.value?.paymentStatus === 'DEPOSIT_PAID') return 'Xác nhận đã nhận đủ phần còn lại'
  return order.value?.payment?.depositAmount ? 'Xác nhận đã nhận cọc' : 'Xác nhận đã nhận chuyển khoản'
})

const confirm = useConfirm()
const confirmingPayment = ref(false)
async function confirmPayment() {
  const ok = await confirm({
    title: `${confirmButtonLabel.value}?`,
    description: 'Đơn thường tự xác nhận qua webhook SePay — chỉ bấm tay khi đã kiểm tra tài khoản ngân hàng thực sự nhận được tiền cho đơn này mà hệ thống chưa tự cập nhật.',
  })
  if (!ok) return
  confirmingPayment.value = true
  try {
    await $fetch(`/api/orders/${id}/confirm-payment`, { method: 'POST' })
    toast.add({ title: 'Đã xác nhận thanh toán', color: 'success' })
    await refresh()
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể xác nhận thanh toán'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    confirmingPayment.value = false
  }
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
            <div class="flex items-center justify-between gap-2">
              <h2 class="font-semibold text-highlighted">
                Sản phẩm
              </h2>
              <UBadge v-if="order.deliveryMode === 'SPLIT'" color="primary" variant="subtle">
                Giao nhiều lần ({{ itemGroups.length }} đợt)
              </UBadge>
            </div>
          </template>

          <template v-if="order.deliveryMode === 'SPLIT'">
            <div v-for="(group, idx) in itemGroups" :key="idx" class="mb-3 last:mb-0">
              <p class="mb-2 flex items-center gap-1 text-xs font-medium text-primary">
                <UIcon name="i-lucide-package" class="size-3.5" /> Đợt {{ idx + 1 }} — dự kiến có hàng trong {{ formatDays(group.days) }}
              </p>
              <div class="space-y-1.5">
                <div v-for="item in group.items" :key="item.id" class="flex justify-between text-sm">
                  <span>{{ item.productName }} ({{ item.unit }}) × {{ item.quantity }}</span>
                  <span class="font-medium">{{ formatVnd(item.lineTotal) }}</span>
                </div>
              </div>
            </div>
          </template>
          <div v-else class="space-y-2">
            <div v-for="item in order.items" :key="item.id" class="flex justify-between text-sm">
              <span>{{ item.productName }} ({{ item.unit }}) × {{ item.quantity }}</span>
              <span class="font-medium">{{ formatVnd(item.lineTotal) }}</span>
            </div>
          </div>

          <p v-if="order.depositPercent && order.paymentMethod !== 'BANK_TRANSFER'" class="mt-4 flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-sm text-warning">
            <UIcon name="i-lucide-circle-alert" class="mt-0.5 size-4 shrink-0" />
            <span>Đơn cần đặt cọc trước {{ order.depositPercent }}% — liên hệ khách để xác nhận cọc.</span>
          </p>
          <p v-if="order.estimatedAvailabilityDays" class="mt-2 flex items-center gap-2 text-sm text-muted">
            <UIcon name="i-lucide-clock" class="size-4 shrink-0" />
            <span>Dự kiến giao hàng trong khoảng {{ order.estimatedAvailabilityDays }} ngày</span>
          </p>
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
            <div class="flex items-center justify-between gap-2">
              <h2 class="font-semibold text-highlighted">
                Thanh toán
              </h2>
              <UBadge :color="paymentStatusColors[order.paymentStatus]" variant="subtle">
                {{ paymentStatusLabels[order.paymentStatus] }}
              </UBadge>
            </div>
          </template>
          <p class="text-sm text-muted">
            {{ paymentMethodLabels[order.paymentMethod] }}
          </p>
          <UButton
            v-if="order.paymentMethod === 'BANK_TRANSFER' && (order.paymentStatus === 'PENDING' || order.paymentStatus === 'DEPOSIT_PAID')"
            class="mt-3"
            size="sm"
            :loading="confirmingPayment"
            @click="confirmPayment"
          >
            {{ confirmButtonLabel }}
          </UButton>
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
            <template v-if="order.payment?.depositAmount">
              <USeparator />
              <div class="flex justify-between">
                <span class="text-muted">Cọc trước</span>
                <span>{{ formatVnd(order.payment.depositAmount) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Còn lại</span>
                <span>{{ formatVnd(remainingAmount ?? 0) }}</span>
              </div>
            </template>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
