<script setup lang="ts">
import type { OrderStatus } from '#shared/types/order'

definePageMeta({ layout: 'admin', middleware: 'admin' })

interface DashboardStats {
  totalRevenue: string
  orderCount: number
  pendingOrders: number
  customerCount: number
  productCount: number
  lowStockVariants: { id: string, unit: string, stock: number, product: { id: string, name: string, slug: string } }[]
  recentOrders: { id: string, orderNumber: string, status: OrderStatus, total: string, recipientName: string, createdAt: string }[]
}

const { data } = await useFetch<DashboardStats>('/api/admin/dashboard', { key: 'admin-dashboard' })

useSeoMeta({ title: 'Tổng quan - Cá nhà biển Admin' })
</script>

<template>
  <div class="space-y-6 p-4 sm:p-6">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <UCard>
        <p class="text-sm text-muted">
          Tổng doanh thu
        </p>
        <p class="mt-1 text-2xl font-bold text-highlighted">
          {{ formatVnd(data?.totalRevenue) }}
        </p>
      </UCard>
      <UCard>
        <p class="text-sm text-muted">
          Tổng đơn hàng
        </p>
        <p class="mt-1 text-2xl font-bold text-highlighted">
          {{ data?.orderCount ?? 0 }}
        </p>
      </UCard>
      <UCard>
        <p class="text-sm text-muted">
          Đơn chờ xác nhận
        </p>
        <p class="mt-1 text-2xl font-bold text-highlighted">
          {{ data?.pendingOrders ?? 0 }}
        </p>
      </UCard>
      <UCard>
        <p class="text-sm text-muted">
          Sản phẩm
        </p>
        <p class="mt-1 text-2xl font-bold text-highlighted">
          {{ data?.productCount ?? 0 }}
        </p>
      </UCard>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <UCard>
        <template #header>
          <h2 class="font-semibold text-highlighted">
            Đơn hàng mới nhất
          </h2>
        </template>
        <div v-if="!data?.recentOrders.length" class="py-6 text-center text-sm text-muted">
          Chưa có đơn hàng
        </div>
        <div v-else class="divide-y divide-default">
          <NuxtLink
            v-for="order in data.recentOrders"
            :key="order.id"
            :to="`/admin/orders/${order.id}`"
            class="flex items-center justify-between py-3 hover:text-primary"
          >
            <div>
              <p class="font-medium">
                {{ order.orderNumber }}
              </p>
              <p class="text-xs text-muted">
                {{ order.recipientName }}
              </p>
            </div>
            <div class="text-right">
              <p class="font-medium">
                {{ formatVnd(order.total) }}
              </p>
              <UBadge :color="orderStatusColors[order.status]" size="sm">
                {{ orderStatusLabels[order.status] }}
              </UBadge>
            </div>
          </NuxtLink>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="font-semibold text-highlighted">
            Sản phẩm sắp hết hàng
          </h2>
        </template>
        <div v-if="!data?.lowStockVariants.length" class="py-6 text-center text-sm text-muted">
          Không có sản phẩm sắp hết hàng
        </div>
        <div v-else class="divide-y divide-default">
          <NuxtLink
            v-for="variant in data.lowStockVariants"
            :key="variant.id"
            :to="`/admin/products/${variant.product.id}`"
            class="flex items-center justify-between py-3 hover:text-primary"
          >
            <div>
              <p class="font-medium">
                {{ variant.product.name }}
              </p>
              <p class="text-xs text-muted">
                {{ variant.unit }}
              </p>
            </div>
            <UBadge color="warning">
              Còn {{ variant.stock }}
            </UBadge>
          </NuxtLink>
        </div>
      </UCard>
    </div>
  </div>
</template>
