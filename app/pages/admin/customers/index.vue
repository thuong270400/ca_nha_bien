<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

interface CustomerRow {
  id: string
  name: string
  email: string
  phone: string | null
  isActive: boolean
  createdAt: string
  _count: { orders: number }
}
interface CustomerList {
  data: CustomerRow[]
  meta: { page: number, limit: number, total: number, totalPages: number }
}

const route = useRoute()
const router = useRouter()
const toast = useToast()

const query = computed(() => ({
  q: (route.query.q as string) || undefined,
  page: route.query.page ? Number(route.query.page) : 1,
  limit: 20,
}))

const { data, refresh } = await useFetch<CustomerList>('/api/admin/customers', {
  key: 'admin-customers',
  query,
})

const searchInput = ref((route.query.q as string) || '')
function submitSearch() {
  router.push({ path: '/admin/customers', query: { q: searchInput.value.trim() || undefined } })
}

function setPage(page: number) {
  router.push({ path: '/admin/customers', query: { ...route.query, page } })
}

const togglingId = ref<string | null>(null)
async function toggleActive(customer: CustomerRow) {
  togglingId.value = customer.id
  try {
    await $fetch(`/api/admin/customers/${customer.id}`, { method: 'PATCH', body: { isActive: !customer.isActive } })
    await refresh()
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể cập nhật khách hàng'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    togglingId.value = null
  }
}

const promoteTarget = ref<CustomerRow | null>(null)
const promoting = ref(false)
function askPromote(customer: CustomerRow) {
  promoteTarget.value = customer
}
async function confirmPromote() {
  if (!promoteTarget.value) return
  promoting.value = true
  try {
    const name = promoteTarget.value.name
    await $fetch(`/api/admin/customers/${promoteTarget.value.id}`, { method: 'PATCH', body: { role: 'ADMIN' } })
    promoteTarget.value = null
    await refresh()
    toast.add({
      title: `Đã thăng cấp ${name} thành Admin`,
      description: 'Người dùng này sẽ không còn xuất hiện trong danh sách khách hàng.',
      color: 'success',
    })
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể thăng cấp khách hàng'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    promoting.value = false
  }
}

useSeoMeta({ title: 'Khách hàng - Cá Nhà Biển Admin' })
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <h1 class="text-xl font-bold text-highlighted">
      Khách hàng
    </h1>

    <form class="max-w-sm" @submit.prevent="submitSearch">
      <UInput v-model="searchInput" icon="i-lucide-search" placeholder="Tìm theo tên, email..." class="w-full" />
    </form>

    <div class="overflow-x-auto rounded-xl border border-default">
      <table class="w-full text-sm">
        <thead class="bg-elevated text-left text-xs uppercase text-muted">
          <tr>
            <th class="px-4 py-3">
              Tên
            </th>
            <th class="px-4 py-3">
              Email
            </th>
            <th class="px-4 py-3">
              SĐT
            </th>
            <th class="px-4 py-3">
              Số đơn hàng
            </th>
            <th class="px-4 py-3">
              Trạng thái
            </th>
            <th class="px-4 py-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr v-for="customer in data?.data ?? []" :key="customer.id">
            <td class="px-4 py-3 font-medium text-highlighted">
              {{ customer.name }}
            </td>
            <td class="px-4 py-3 text-muted">
              {{ customer.email }}
            </td>
            <td class="px-4 py-3 text-muted">
              {{ customer.phone ?? '-' }}
            </td>
            <td class="px-4 py-3">
              {{ customer._count.orders }}
            </td>
            <td class="px-4 py-3">
              <UBadge :color="customer.isActive ? 'success' : 'error'">
                {{ customer.isActive ? 'Hoạt động' : 'Đã khoá' }}
              </UBadge>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex justify-end gap-2">
                <UButton
                  size="sm"
                  variant="ghost"
                  color="warning"
                  icon="i-lucide-shield-plus"
                  @click="askPromote(customer)"
                >
                  Thăng cấp Admin
                </UButton>
                <UButton
                  size="sm"
                  variant="ghost"
                  :color="customer.isActive ? 'error' : 'success'"
                  :loading="togglingId === customer.id"
                  @click="toggleActive(customer)"
                >
                  {{ customer.isActive ? 'Khoá' : 'Mở khoá' }}
                </UButton>
              </div>
            </td>
          </tr>
          <tr v-if="!data?.data.length">
            <td colspan="6" class="px-4 py-10 text-center text-muted">
              Không có khách hàng nào
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

    <UModal :open="Boolean(promoteTarget)" title="Thăng cấp thành Admin" @update:open="(v) => { if (!v) promoteTarget = null }">
      <template #body>
        <p class="text-sm text-muted">
          Bạn có chắc muốn thăng cấp <strong class="text-highlighted">{{ promoteTarget?.name }}</strong> ({{ promoteTarget?.email }}) thành Admin?
          Hành động này không thể hoàn tác qua giao diện.
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="outline" @click="promoteTarget = null">
            Huỷ
          </UButton>
          <UButton color="warning" :loading="promoting" @click="confirmPromote">
            Xác nhận thăng cấp
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
