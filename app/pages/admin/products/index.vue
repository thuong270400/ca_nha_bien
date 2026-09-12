<script setup lang="ts">
import type { PaginatedResult, Product } from '#shared/types/catalog'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const toast = useToast()

const limitOptions = [
  { label: '10 / trang', value: 10 },
  { label: '20 / trang', value: 20 },
  { label: '50 / trang', value: 50 },
  { label: '100 / trang', value: 100 },
]

const query = computed(() => ({
  q: (route.query.q as string) || undefined,
  page: route.query.page ? Number(route.query.page) : 1,
  limit: route.query.limit ? Number(route.query.limit) : 20,
}))

const { data, refresh } = await useFetch<PaginatedResult<Product>>('/api/products', {
  key: 'admin-products',
  query,
})

const searchInput = ref((route.query.q as string) || '')
function submitSearch() {
  router.push({ path: '/admin/products', query: { ...route.query, q: searchInput.value.trim() || undefined, page: undefined } })
}

function setPage(page: number) {
  router.push({ path: '/admin/products', query: { ...route.query, page } })
}

function setLimit(limit: number) {
  router.push({ path: '/admin/products', query: { ...route.query, limit, page: undefined } })
}

const deletingId = ref<string | null>(null)
async function deleteProduct(id: string) {
  deletingId.value = id
  try {
    await $fetch(`/api/products/${id}`, { method: 'DELETE' })
    toast.add({ title: 'Đã ẩn sản phẩm', color: 'success' })
    await refresh()
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể xoá sản phẩm'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    deletingId.value = null
  }
}

const restoringId = ref<string | null>(null)
async function restoreProduct(id: string) {
  restoringId.value = id
  try {
    await $fetch(`/api/products/${id}`, { method: 'PATCH', body: { status: 'ACTIVE' } })
    toast.add({ title: 'Đã khôi phục sản phẩm', color: 'success' })
    await refresh()
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể khôi phục sản phẩm'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    restoringId.value = null
  }
}

const hardDeletingId = ref<string | null>(null)
async function hardDeleteProduct(id: string, name: string) {
  if (!confirm(`Xoá vĩnh viễn sản phẩm "${name}"? Hành động này không thể hoàn tác.`)) return
  hardDeletingId.value = id
  try {
    await $fetch(`/api/products/${id}/permanent`, { method: 'DELETE' })
    toast.add({ title: 'Đã xoá vĩnh viễn sản phẩm', color: 'success' })
    await refresh()
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể xoá vĩnh viễn sản phẩm'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    hardDeletingId.value = null
  }
}

useSeoMeta({ title: 'Sản phẩm - Cá Nhà Biển Admin' })
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-xl font-bold text-highlighted">
        Sản phẩm
      </h1>
      <UButton to="/admin/products/create" icon="i-lucide-plus">
        Thêm sản phẩm
      </UButton>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-3">
      <form class="max-w-sm flex-1" @submit.prevent="submitSearch">
        <UInput v-model="searchInput" icon="i-lucide-search" placeholder="Tìm sản phẩm..." class="w-full" />
      </form>
      <USelect
        :model-value="query.limit"
        :items="limitOptions"
        class="w-36"
        @update:model-value="setLimit"
      />
    </div>

    <div class="overflow-x-auto rounded-xl border border-default">
      <table class="w-full text-sm">
        <thead class="bg-elevated text-left text-xs uppercase text-muted">
          <tr>
            <th class="px-4 py-3">
              Sản phẩm
            </th>
            <th class="px-4 py-3">
              Danh mục
            </th>
            <th class="px-4 py-3">
              Giá
            </th>
            <th class="px-4 py-3">
              Tồn kho
            </th>
            <th class="px-4 py-3">
              Trạng thái
            </th>
            <th class="px-4 py-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr v-for="product in data?.data ?? []" :key="product.id">
            <td class="flex items-center gap-3 px-4 py-3">
              <img
                :src="product.images[0]?.url ?? '/images/placeholder-fish.svg'"
                :alt="product.name"
                class="size-10 rounded object-cover"
              >
              <span class="font-medium text-highlighted">{{ product.name }}</span>
            </td>
            <td class="px-4 py-3 text-muted">
              {{ product.category.name }}
            </td>
            <td class="px-4 py-3">
              {{ formatVnd(product.price) }}
            </td>
            <td class="px-4 py-3">
              {{ product.variants.reduce((s, v) => s + v.stock, 0) }}
            </td>
            <td class="px-4 py-3">
              <UBadge :color="product.deletedAt ? 'error' : product.status === 'ACTIVE' ? 'success' : 'neutral'">
                {{ product.deletedAt ? 'Đã xoá' : product.status === 'ACTIVE' ? 'Đang bán' : 'Ngừng bán' }}
              </UBadge>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex justify-end gap-2">
                <UButton :to="`/admin/products/${product.id}`" icon="i-lucide-pencil" size="sm" variant="ghost" />
                <template v-if="product.deletedAt">
                  <UButton
                    icon="i-lucide-rotate-ccw"
                    size="sm"
                    variant="ghost"
                    color="primary"
                    :loading="restoringId === product.id"
                    @click="restoreProduct(product.id)"
                  />
                  <UButton
                    icon="i-lucide-trash-2"
                    size="sm"
                    variant="ghost"
                    color="error"
                    :loading="hardDeletingId === product.id"
                    @click="hardDeleteProduct(product.id, product.name)"
                  />
                </template>
                <UButton
                  v-else
                  icon="i-lucide-trash-2"
                  size="sm"
                  variant="ghost"
                  color="error"
                  :loading="deletingId === product.id"
                  @click="deleteProduct(product.id)"
                />
              </div>
            </td>
          </tr>
          <tr v-if="!data?.data.length">
            <td colspan="6" class="px-4 py-10 text-center text-muted">
              Không có sản phẩm nào
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
