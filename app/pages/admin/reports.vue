<script setup lang="ts">
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'vue-chartjs'
import type { OrderStatus } from '#shared/types/order'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend)

definePageMeta({ layout: 'admin', middleware: 'admin' })

interface ReportData {
  revenueOverTime: { date: string, revenue: number }[]
  topProducts: { productId: string | null, productName: string, quantity: number, revenue: string }[]
  statusBreakdown: { status: string, count: number }[]
}

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10)
}

const today = new Date()
const thirtyDaysAgo = new Date(today)
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)

const fromInput = ref(toDateInput(thirtyDaysAgo))
const toInput = ref(toDateInput(today))

function setPreset(days: number) {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - (days - 1))
  fromInput.value = toDateInput(start)
  toInput.value = toDateInput(end)
}

function setThisMonth() {
  const now = new Date()
  fromInput.value = toDateInput(new Date(now.getFullYear(), now.getMonth(), 1))
  toInput.value = toDateInput(now)
}

const { data } = await useFetch<ReportData>('/api/admin/reports', {
  key: 'admin-reports',
  query: computed(() => ({ from: fromInput.value, to: toInput.value, groupBy: 'day' })),
})

const revenueChartData = computed(() => ({
  labels: data.value?.revenueOverTime.map(r => r.date) ?? [],
  datasets: [{
    label: 'Doanh thu',
    data: data.value?.revenueOverTime.map(r => r.revenue) ?? [],
    borderColor: '#0ea5e9',
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    tension: 0.3,
    fill: true,
  }],
}))

const topProductsChartData = computed(() => ({
  labels: data.value?.topProducts.map(p => p.productName) ?? [],
  datasets: [{
    label: 'Số lượng bán',
    data: data.value?.topProducts.map(p => p.quantity) ?? [],
    backgroundColor: '#0ea5e9',
  }],
}))

const statusChartData = computed(() => ({
  labels: data.value?.statusBreakdown.map(s => orderStatusLabels[s.status as OrderStatus] ?? s.status) ?? [],
  datasets: [{
    data: data.value?.statusBreakdown.map(s => s.count) ?? [],
    backgroundColor: ['#f59e0b', '#0ea5e9', '#8b5cf6', '#06b6d4', '#22c55e', '#ef4444'],
  }],
}))

const chartOptions = { responsive: true, maintainAspectRatio: false }

useSeoMeta({ title: 'Báo cáo - Cá Nhà Biển Admin' })
</script>

<template>
  <div class="space-y-6 p-4 sm:p-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-xl font-bold text-highlighted">
        Báo cáo doanh thu
      </h1>
      <div class="flex flex-wrap items-center gap-2">
        <UButton size="sm" variant="outline" @click="setPreset(7)">
          7 ngày
        </UButton>
        <UButton size="sm" variant="outline" @click="setPreset(30)">
          30 ngày
        </UButton>
        <UButton size="sm" variant="outline" @click="setThisMonth">
          Tháng này
        </UButton>
        <input v-model="fromInput" type="date" class="rounded-md border border-default bg-default px-2 py-1.5 text-sm">
        <span class="text-muted">-</span>
        <input v-model="toInput" type="date" class="rounded-md border border-default bg-default px-2 py-1.5 text-sm">
      </div>
    </div>

    <UCard>
      <template #header>
        <h2 class="font-semibold text-highlighted">
          Doanh thu theo thời gian
        </h2>
      </template>
      <ClientOnly>
        <div class="h-72">
          <Line :data="revenueChartData" :options="chartOptions" />
        </div>
      </ClientOnly>
    </UCard>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <UCard>
        <template #header>
          <h2 class="font-semibold text-highlighted">
            Top sản phẩm bán chạy
          </h2>
        </template>
        <ClientOnly>
          <div class="h-72">
            <Bar :data="topProductsChartData" :options="chartOptions" />
          </div>
        </ClientOnly>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="font-semibold text-highlighted">
            Phân bố trạng thái đơn hàng
          </h2>
        </template>
        <ClientOnly>
          <div class="h-72">
            <Doughnut :data="statusChartData" :options="chartOptions" />
          </div>
        </ClientOnly>
      </UCard>
    </div>
  </div>
</template>
