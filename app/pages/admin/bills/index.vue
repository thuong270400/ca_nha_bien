<script setup lang="ts">
import type { PaginatedResult } from '#shared/types/catalog'
import type { OrderStatus, OrderView } from '#shared/types/order'

definePageMeta({ layout: 'admin', middleware: 'admin' })

// Quản lý hoá đơn: mỗi đơn hàng sinh ra một hoá đơn (phiếu) để in bỏ vào hàng,
// gửi khách, đối soát — dữ liệu lấy thẳng từ Order, không có bảng riêng.
const route = useRoute()
const router = useRouter()
const toast = useToast()

const statusOptions: { label: string, value: OrderStatus | 'ALL' }[] = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Chờ xác nhận', value: 'PENDING' },
  { label: 'Đã xác nhận', value: 'CONFIRMED' },
  { label: 'Đang chuẩn bị', value: 'PROCESSING' },
  { label: 'Đang giao hàng', value: 'SHIPPING' },
  { label: 'Đã giao hàng', value: 'DELIVERED' },
  { label: 'Đã huỷ', value: 'CANCELLED' },
]

const query = computed(() => ({
  status: (route.query.status as OrderStatus) || undefined,
  page: route.query.page ? Number(route.query.page) : 1,
  limit: 20,
}))

const { data } = await useFetch<PaginatedResult<OrderView>>('/api/orders', {
  key: 'admin-bills',
  query,
})

const billOpen = ref(false)
const billOrder = ref<OrderView | null>(null)
const loadingId = ref<string | null>(null)

async function openBill(id: string) {
  loadingId.value = id
  try {
    billOrder.value = await $fetch<OrderView>(`/api/orders/${id}`)
    billOpen.value = true
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể tải hoá đơn'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    loadingId.value = null
  }
}

function setStatus(status: string) {
  router.push({ path: '/admin/bills', query: status === 'ALL' ? {} : { status } })
}

function setPage(page: number) {
  router.push({ path: '/admin/bills', query: { ...route.query, page } })
}

useSeoMeta({ title: 'Hoá đơn - Cá Nhà Biển Admin' })
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <h1 class="text-xl font-bold text-highlighted">
      Hoá đơn
    </h1>

    <USelect
      :model-value="(route.query.status as OrderStatus) || 'ALL'"
      :items="statusOptions"
      class="w-56"
      @update:model-value="setStatus"
    />

    <div class="overflow-x-auto rounded-xl border border-default">
      <table class="w-full text-sm">
        <thead class="bg-elevated text-left text-xs uppercase text-muted">
          <tr>
            <th class="px-4 py-3">
              Mã đơn
            </th>
            <th class="px-4 py-3">
              Khách hàng
            </th>
            <th class="px-4 py-3">
              SĐT
            </th>
            <th class="px-4 py-3">
              Tổng thanh toán
            </th>
            <th class="px-4 py-3">
              Thanh toán
            </th>
            <th class="px-4 py-3">
              Ngày đặt
            </th>
            <th class="px-4 py-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr v-for="order in data?.data ?? []" :key="order.id">
            <td class="px-4 py-3 font-medium text-highlighted">
              {{ order.orderNumber }}
            </td>
            <td class="px-4 py-3">
              {{ order.recipientName }}
            </td>
            <td class="px-4 py-3">
              {{ order.recipientPhone }}
            </td>
            <td class="px-4 py-3">
              {{ formatVnd(order.total) }}
            </td>
            <td class="px-4 py-3">
              <div class="flex flex-col items-start gap-1">
                <span class="text-xs text-muted">{{ order.paymentMethod === 'COD' ? 'COD' : 'Chuyển khoản' }}</span>
                <UBadge :color="paymentStatusColors[order.paymentStatus]" variant="subtle">
                  {{ paymentStatusLabels[order.paymentStatus] }}
                </UBadge>
              </div>
            </td>
            <td class="px-4 py-3 text-muted">
              {{ new Date(order.createdAt).toLocaleString('vi-VN') }}
            </td>
            <td class="px-4 py-3 text-right">
              <UButton
                icon="i-lucide-receipt-text"
                size="sm"
                variant="soft"
                :loading="loadingId === order.id"
                @click="openBill(order.id)"
              >
                Xem
              </UButton>
            </td>
          </tr>
          <tr v-if="!data?.data.length">
            <td colspan="7" class="px-4 py-10 text-center text-muted">
              Không có hoá đơn nào
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="data && data.meta.totalPages > 1" class="flex justify-center">
      <UPagination
        :page="data.meta.page"
        :total="data.meta.total"
        :items-per-page="data.meta.limit"
        @update:page="setPage"
      />
    </div>

    <OrderBillModal v-model:open="billOpen" :order="billOrder" />
  </div>
</template>
