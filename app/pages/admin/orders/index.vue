<script setup lang="ts">
import type { PaginatedResult } from '#shared/types/catalog'
import type { OrderStatus, OrderView } from '#shared/types/order'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()

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
  key: 'admin-orders',
  query,
})

function setStatus(status: string) {
  router.push({ path: '/admin/orders', query: status === 'ALL' ? {} : { status } })
}

function setPage(page: number) {
  router.push({ path: '/admin/orders', query: { ...route.query, page } })
}

useSeoMeta({ title: 'Đơn hàng - Cá Nhà Biển Admin' })
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <h1 class="text-xl font-bold text-highlighted">
      Đơn hàng
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
              Tổng tiền
            </th>
            <th class="px-4 py-3">
              Trạng thái
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
              {{ formatVnd(order.total) }}
            </td>
            <td class="px-4 py-3">
              <div class="flex flex-wrap items-center gap-1">
                <UBadge :color="orderStatusColors[order.status]">
                  {{ orderStatusLabels[order.status] }}
                </UBadge>
                <UBadge v-if="order.depositPercent" color="warning" variant="subtle">
                  Cọc {{ order.depositPercent }}%
                </UBadge>
                <UBadge v-if="order.deliveryMode === 'SPLIT'" color="primary" variant="subtle">
                  Giao nhiều lần
                </UBadge>
              </div>
            </td>
            <td class="px-4 py-3">
              <UBadge :color="paymentStatusColors[order.paymentStatus]" variant="subtle">
                {{ paymentStatusLabels[order.paymentStatus] }}
              </UBadge>
            </td>
            <td class="px-4 py-3 text-muted">
              {{ new Date(order.createdAt).toLocaleDateString('vi-VN') }}
            </td>
            <td class="px-4 py-3 text-right">
              <UButton :to="`/admin/orders/${order.id}`" icon="i-lucide-eye" size="sm" variant="ghost" />
            </td>
          </tr>
          <tr v-if="!data?.data.length">
            <td colspan="7" class="px-4 py-10 text-center text-muted">
              Không có đơn hàng nào
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
  </div>
</template>
