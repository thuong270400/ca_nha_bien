<script setup lang="ts">
import type { OrderStatus, OrderView, PaymentStatus } from '#shared/types/order'
import { formatDays, groupByAvailabilityDays } from '#shared/utils/sourcing'

// Chi tiết đơn dùng chung cho trang /admin/orders/:id và popup ở danh sách
// đơn. Component chỉ hiển thị + gọi API thay đổi, việc tải lại `order` do
// nơi dùng đảm nhận qua emit('refresh').
const props = defineProps<{
  order: OrderView
  /** Ẩn tiêu đề "Đơn hàng ..." khi nơi dùng đã tự hiển thị (vd. title của UModal). */
  hideTitle?: boolean
}>()

const emit = defineEmits<{ refresh: [] }>()

const toast = useToast()
const confirm = useConfirm()

const statusOptions: { label: string, value: OrderStatus }[] = [
  { label: 'Chờ xác nhận', value: 'PENDING' },
  { label: 'Đã xác nhận', value: 'CONFIRMED' },
  { label: 'Đang chuẩn bị', value: 'PROCESSING' },
  { label: 'Đang giao hàng', value: 'SHIPPING' },
  { label: 'Đã giao hàng', value: 'DELIVERED' },
  { label: 'Đã huỷ', value: 'CANCELLED' },
]

function errorMessage(err: unknown, fallback: string) {
  return (err as { data?: { message?: string } })?.data?.message ?? fallback
}

const updating = ref(false)
async function updateStatus(status: string) {
  updating.value = true
  try {
    await $fetch(`/api/orders/${props.order.id}`, { method: 'PATCH', body: { status } })
    toast.add({ title: 'Đã cập nhật trạng thái đơn hàng', color: 'success' })
    emit('refresh')
  } catch (err) {
    toast.add({ title: 'Lỗi', description: errorMessage(err, 'Không thể cập nhật trạng thái'), color: 'error' })
  } finally {
    updating.value = false
  }
}

// Chỉnh tay trạng thái thanh toán (COD đã thu tiền, hoàn tiền, sửa nhầm...).
// DEPOSIT_PAID chỉ hiện khi đơn có tách cọc.
const paymentStatusOptions = computed(() =>
  (Object.keys(paymentStatusLabels) as PaymentStatus[])
    .filter(value => value !== 'DEPOSIT_PAID' || Boolean(props.order.payment?.depositAmount))
    .map(value => ({ label: paymentStatusLabels[value], value })),
)

const updatingPayment = ref(false)
async function updatePaymentStatus(paymentStatus: PaymentStatus) {
  if (paymentStatus === props.order.paymentStatus) return
  const ok = await confirm({
    title: `Đổi trạng thái thanh toán thành "${paymentStatusLabels[paymentStatus]}"?`,
    description: 'Thay đổi thủ công sẽ ghi đè trạng thái hiện tại, kể cả trạng thái do webhook SePay tự cập nhật.',
  })
  if (!ok) return
  updatingPayment.value = true
  try {
    await $fetch(`/api/orders/${props.order.id}/payment-status`, { method: 'PATCH', body: { paymentStatus } })
    toast.add({ title: 'Đã cập nhật trạng thái thanh toán', color: 'success' })
    emit('refresh')
  } catch (err) {
    toast.add({ title: 'Lỗi', description: errorMessage(err, 'Không thể cập nhật trạng thái thanh toán'), color: 'error' })
  } finally {
    updatingPayment.value = false
  }
}

// Nhóm sản phẩm theo số ngày dự kiến có hàng khi khách đã chọn "giao nhiều
// lần" ở checkout (Order.deliveryMode) — xem shared/utils/sourcing.ts.
const itemGroups = computed(() => groupByAvailabilityDays(props.order.items))

// Đơn có tách cọc (payment.depositAmount) xác nhận theo 2 bước tuần tự — nút
// bấm tay chỉ xác nhận ĐÚNG bước đang chờ (PENDING: cọc trước, DEPOSIT_PAID:
// phần còn lại), xem order.service.ts#confirmBankTransferPayment.
const remainingAmount = computed(() => {
  if (!props.order.payment?.depositAmount) return null
  return Number(props.order.total) - Number(props.order.payment.depositAmount)
})
const confirmButtonLabel = computed(() => {
  if (props.order.paymentStatus === 'DEPOSIT_PAID') return 'Xác nhận đã nhận đủ phần còn lại'
  return props.order.payment?.depositAmount ? 'Xác nhận đã nhận cọc' : 'Xác nhận đã nhận chuyển khoản'
})

const confirmingPayment = ref(false)
async function confirmPayment() {
  const ok = await confirm({
    title: `${confirmButtonLabel.value}?`,
    description: 'Đơn thường tự xác nhận qua webhook SePay — chỉ bấm tay khi đã kiểm tra tài khoản ngân hàng thực sự nhận được tiền cho đơn này mà hệ thống chưa tự cập nhật.',
  })
  if (!ok) return
  confirmingPayment.value = true
  try {
    await $fetch(`/api/orders/${props.order.id}/confirm-payment`, { method: 'POST' })
    toast.add({ title: 'Đã xác nhận thanh toán', color: 'success' })
    emit('refresh')
  } catch (err) {
    toast.add({ title: 'Lỗi', description: errorMessage(err, 'Không thể xác nhận thanh toán'), color: 'error' })
  } finally {
    confirmingPayment.value = false
  }
}

// QR chuyển khoản cho bước đang chờ — cùng cách tính với trang đơn của khách
// (app/pages/order/[id].vue): cọc trước (PENDING) hoặc phần còn lại
// (DEPOSIT_PAID), luôn dựng từ Payment.bankSnapshot chứ không từ Setting.
// Điều kiện đọc từ order.paymentMethod/paymentStatus — cùng nguồn với badge —
// để khung QR luôn khớp với trạng thái admin đang thấy. COD cũng có QR (khách
// quét lúc nhận hàng thay vì trả tiền mặt), webhook SePay xác nhận được cả 2.
const qrAmount = computed(() => {
  const { order } = props
  if (order.paymentMethod !== 'BANK_TRANSFER' && order.paymentMethod !== 'COD') return null
  if (order.paymentStatus === 'PENDING') return Number(order.payment?.depositAmount ?? order.total)
  if (order.paymentStatus === 'DEPOSIT_PAID') return remainingAmount.value
  return null
})
const qrImageUrl = computed(() => {
  if (!props.order.payment?.bankSnapshot || qrAmount.value === null) return null
  return buildVietQrImageUrl(props.order.payment.bankSnapshot, {
    amount: qrAmount.value,
    addInfo: props.order.orderNumber,
  })
})

// Trong lúc đang chờ chuyển khoản, tải lại mỗi 5s để thấy ngay khi webhook
// SePay xác nhận (khách quét QR ngay tại quầy).
let pollTimer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  watch(qrAmount, (amount) => {
    clearInterval(pollTimer)
    pollTimer = amount !== null ? setInterval(() => emit('refresh'), 5000) : undefined
  }, { immediate: true })
})
onBeforeUnmount(() => clearInterval(pollTimer))
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 v-if="!hideTitle" class="text-xl font-bold text-highlighted">
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
                  <span>{{ item.productName }} ({{ item.unit }}) × {{ item.quantity }}<span v-if="item.comboItems?.length" class="block text-xs text-muted">Gồm: {{ formatComboContents(item.comboItems) }}</span></span>
                  <span class="font-medium">{{ formatVnd(item.lineTotal) }}</span>
                </div>
              </div>
            </div>
          </template>
          <div v-else class="space-y-2">
            <div v-for="item in order.items" :key="item.id" class="flex justify-between text-sm">
              <span>{{ item.productName }} ({{ item.unit }}) × {{ item.quantity }}<span v-if="item.comboItems?.length" class="block text-xs text-muted">Gồm: {{ formatComboContents(item.comboItems) }}</span></span>
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
        <UCard v-if="qrAmount !== null">
          <template #header>
            <h2 class="font-semibold text-highlighted">
              Mã QR chuyển khoản
            </h2>
          </template>
          <template v-if="qrImageUrl">
            <img :src="qrImageUrl" alt="QR chuyển khoản VietQR" class="mx-auto w-56 rounded-lg border border-default">
            <p class="mt-3 text-center text-sm">
              <template v-if="order.paymentStatus === 'DEPOSIT_PAID'">
                Phần còn lại: <span class="font-semibold text-primary">{{ formatVnd(qrAmount) }}</span>
              </template>
              <template v-else-if="order.payment?.depositAmount">
                Tiền cọc: <span class="font-semibold text-primary">{{ formatVnd(qrAmount) }}</span>
              </template>
              <template v-else>
                Số tiền: <span class="font-semibold text-primary">{{ formatVnd(qrAmount) }}</span>
              </template>
            </p>
            <p v-if="order.payment?.bankSnapshot?.bankAccountNumber" class="mt-1 text-center text-xs text-muted">
              {{ order.payment.bankSnapshot.bankName }} · {{ order.payment.bankSnapshot.bankAccountNumber }} · {{ order.payment.bankSnapshot.bankAccountName }}
            </p>
            <p class="mt-1 text-center text-xs text-muted">
              Nội dung: {{ order.orderNumber }} — tự cập nhật khi nhận được tiền
            </p>
          </template>
          <p v-else class="text-sm text-muted">
            Không thể hiển thị mã QR (đơn thiếu thông tin ngân hàng<template v-if="order.paymentMethod === 'COD'"> — đơn COD đặt trước khi có QR, hoặc lúc đặt chưa cấu hình tài khoản</template>).
          </p>
        </UCard>

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
          <UFormField label="Trạng thái thanh toán" class="mt-3">
            <USelect
              :model-value="order.paymentStatus"
              :items="paymentStatusOptions"
              :loading="updatingPayment"
              class="w-full"
              @update:model-value="updatePaymentStatus"
            />
          </UFormField>
          <UButton
            v-if="qrAmount !== null"
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
