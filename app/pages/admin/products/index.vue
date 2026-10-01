<script setup lang="ts">
import type { Category, PaginatedResult, Product, Tag } from '#shared/types/catalog'

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

const confirm = useConfirm()
const deletingId = ref<string | null>(null)
async function deleteProduct(id: string, name: string) {
  const ok = await confirm({ title: `Ẩn sản phẩm "${name}"?`, description: 'Sản phẩm sẽ ngừng hiển thị trên cửa hàng, bạn có thể khôi phục sau.', confirmLabel: 'Ẩn' })
  if (!ok) return
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
  const ok = await confirm({ title: `Xoá vĩnh viễn sản phẩm "${name}"?` })
  if (!ok) return
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

const editOpen = ref(false)
const editProduct = ref<Product | null>(null)
const editLoadingId = ref<string | null>(null)
const editSaving = ref(false)
const formCategories = ref<Category[]>([])
const formTags = ref<Tag[]>([])

async function openEdit(id: string) {
  editLoadingId.value = id
  try {
    const [product, categories, tags] = await Promise.all([
      $fetch<Product>(`/api/products/${id}`),
      formCategories.value.length ? formCategories.value : $fetch<Category[]>('/api/categories'),
      formTags.value.length ? formTags.value : $fetch<Tag[]>('/api/tags'),
    ])
    formCategories.value = categories
    formTags.value = tags
    editProduct.value = product
    editOpen.value = true
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể tải sản phẩm'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    editLoadingId.value = null
  }
}

async function saveEdit(payload: Record<string, unknown>) {
  if (!editProduct.value) return
  editSaving.value = true
  try {
    await $fetch(`/api/products/${editProduct.value.id}`, { method: 'PATCH', body: payload })
    toast.add({ title: 'Đã lưu thay đổi', color: 'success' })
    editOpen.value = false
    await refresh()
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể lưu sản phẩm'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    editSaving.value = false
  }
}

const expandedIds = ref(new Set<string>())
function toggleExpand(id: string) {
  const next = new Set(expandedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedIds.value = next
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
            <th class="w-10 px-2 py-3" />
            <th class="px-4 py-3">
              Sản phẩm
            </th>
            <th class="px-4 py-3">
              Giá nhập kho
            </th>
            <th class="px-4 py-3">
              Tồn kho
            </th>
            <th class="px-4 py-3">
              Danh mục
            </th>
            <th class="px-4 py-3">
              Trạng thái
            </th>
            <th class="px-4 py-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <template v-for="product in data?.data ?? []" :key="product.id">
            <tr>
              <td class="px-2 py-3">
                <UButton
                  :icon="expandedIds.has(product.id) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  :aria-label="expandedIds.has(product.id) ? 'Thu gọn' : 'Xem đơn vị'"
                  @click="toggleExpand(product.id)"
                />
              </td>
              <td class="px-4 py-3">
                <button type="button" class="flex items-center gap-3 text-left" @click="toggleExpand(product.id)">
                  <img
                    :src="product.images[0]?.url ?? '/images/placeholder-fish.svg'"
                    :alt="product.name"
                    class="size-10 rounded object-cover"
                  >
                  <span>
                    <span class="block font-medium text-highlighted">{{ product.name }}</span>
                    <span class="block text-xs text-muted">{{ product.variants.length }} đơn vị</span>
                  </span>
                </button>
              </td>
              <td class="px-4 py-3">
                <span v-if="product.importPrice != null">{{ formatVnd(product.importPrice) }}</span>
                <span v-else class="text-dimmed">—</span>
              </td>
              <td class="px-4 py-3">
                {{ product.variants.reduce((s, v) => s + v.stock, 0) }}
              </td>
              <td class="px-4 py-3 text-muted">
                {{ product.categories.map(c => c.name).join(', ') }}
              </td>
              <td class="px-4 py-3">
                <UBadge :color="product.deletedAt ? 'error' : product.status === 'ACTIVE' ? 'success' : 'neutral'">
                  {{ product.deletedAt ? 'Đã xoá' : product.status === 'ACTIVE' ? 'Đang bán' : 'Ngừng bán' }}
                </UBadge>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex justify-end gap-2">
                  <UButton
                    icon="i-lucide-pencil"
                    size="sm"
                    variant="ghost"
                    :loading="editLoadingId === product.id"
                    @click="openEdit(product.id)"
                  />
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
                    @click="deleteProduct(product.id, product.name)"
                  />
                </div>
              </td>
            </tr>
            <tr v-if="expandedIds.has(product.id)" class="bg-elevated/40">
              <td />
              <td colspan="6" class="px-4 py-2">
                <table class="w-full text-sm">
                  <thead class="text-left text-xs text-muted">
                    <tr>
                      <th class="py-1.5 pr-4 font-medium">
                        Đơn vị
                      </th>
                      <th class="py-1.5 pr-4 font-medium">
                        SKU
                      </th>
                      <th class="py-1.5 pr-4 text-right font-medium">
                        Giá bán
                      </th>
                      <th class="py-1.5 pr-4 text-right font-medium">
                        Giá gốc
                      </th>
                      <th class="py-1.5 text-right font-medium">
                        Tồn kho
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-default">
                    <tr v-for="variant in product.variants" :key="variant.id">
                      <td class="py-1.5 pr-4">
                        {{ variant.unit }}
                        <UBadge v-if="variant.isDefault" size="sm" variant="subtle" class="ml-1">
                          Mặc định
                        </UBadge>
                      </td>
                      <td class="py-1.5 pr-4 text-muted">
                        {{ variant.sku || '—' }}
                      </td>
                      <td class="py-1.5 pr-4 text-right font-medium">
                        {{ formatVnd(variant.price) }}
                      </td>
                      <td class="py-1.5 pr-4 text-right text-muted">
                        <span v-if="variant.compareAtPrice" class="line-through">{{ formatVnd(variant.compareAtPrice) }}</span>
                        <span v-else>—</span>
                      </td>
                      <td class="py-1.5 text-right">
                        {{ variant.stock }}
                      </td>
                    </tr>
                    <tr v-if="!product.variants.length">
                      <td colspan="5" class="py-2 text-center text-muted">
                        Chưa có đơn vị nào
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </template>
          <tr v-if="!data?.data.length">
            <td colspan="7" class="px-4 py-10 text-center text-muted">
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

    <UModal
      v-model:open="editOpen"
      :title="editProduct ? `Sửa: ${editProduct.name}` : 'Sửa sản phẩm'"
      :dismissible="!editSaving"
      :ui="{ content: 'sm:max-w-5xl' }"
    >
      <template #body>
        <AdminProductForm
          v-if="editProduct"
          :key="editProduct.id"
          :categories="formCategories"
          :tags="formTags"
          :initial="editProduct"
          :loading="editSaving"
          @submit="saveEdit"
          @cancel="editOpen = false"
        />
      </template>
    </UModal>
  </div>
</template>
