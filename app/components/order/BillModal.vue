<script setup lang="ts">
import type { OrderView } from '#shared/types/order'

defineProps<{ order: OrderView | null }>()
const open = defineModel<boolean>('open', { default: false })

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
        <OrderBill ref="bill" :order="order" />
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
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
