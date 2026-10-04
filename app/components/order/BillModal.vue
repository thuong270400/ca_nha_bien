<script setup lang="ts">
import type { OrderView } from '#shared/types/order'

const props = defineProps<{ order: OrderView | null }>()
const open = defineModel<boolean>('open', { default: false })

// Ẩn/hiện QR thanh toán trên hoá đơn (cả khi in). Ô tích hiện với mọi đơn
// COD/chuyển khoản có snapshot ngân hàng; mặc định bật khi đơn còn chờ thanh
// toán, tắt khi đã thanh toán xong.
const showQr = ref(false)
const hasQr = computed(() => {
  const order = props.order
  const bank = order?.payment?.bankSnapshot
  return !!order && !!bank?.bankCode && !!bank.bankAccountNumber
    && (order.paymentMethod === 'BANK_TRANSFER' || order.paymentMethod === 'COD')
})
watch([() => props.order, open], () => {
  showQr.value = !!props.order && billPaymentSummary(props.order).qrAmount !== null
}, { immediate: true })

const bill = ref<{ root: HTMLElement | null } | null>(null)

function print(orderNumber: string) {
  if (bill.value?.root) printBill(bill.value.root, orderNumber)
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="order ? `Hoá đơn ${order.orderNumber}` : 'Hoá đơn'"
    :ui="{ content: 'sm:max-w-3xl' }"
  >
    <template #body>
      <div v-if="order" class="overflow-hidden rounded-lg border border-default">
        <OrderBill ref="bill" :order="order" :show-qr="showQr" />
      </div>
    </template>
    <template #footer>
      <div class="flex w-full items-center justify-end gap-2">
        <UCheckbox v-if="hasQr" v-model="showQr" label="Hiện QR thanh toán" class="mr-auto" />
        <UButton color="neutral" variant="outline" @click="open = false">
          Đóng
        </UButton>
        <UButton v-if="order" icon="i-lucide-printer" @click="print(order.orderNumber)">
          In / Xuất PDF
        </UButton>
      </div>
    </template>
  </UModal>
</template>
