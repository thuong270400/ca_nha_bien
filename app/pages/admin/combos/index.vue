<script setup lang="ts">
import type { Category, PaginatedResult, Product } from '#shared/types/catalog'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const query = computed(() => ({
  combo: true,
  q: (route.query.q as string) || undefined,
  page: route.query.page ? Number(route.query.page) : 1,
  limit: 20,
}))

const { data, refresh } = await useFetch<PaginatedResult<Product>>('/api/products', {
  key: 'admin-combos',
  query,
})

const searchInput = ref((route.query.q as string) || '')
function submitSearch() {
  router.push({ path: '/admin/combos', query: { ...route.query, q: searchInput.value.trim() || undefined, page: undefined } })
}

function setPage(page: number) {
  router.push({ path: '/admin/combos', query: { ...route.query, page } })
}

function errorMessage(err: unknown, fallback: string) {
  return (err as { data?: { message?: string } })?.data?.message ?? fallback
}

// ---------------------------------------------------------------------------
// Popup tạo / sửa combo
// ---------------------------------------------------------------------------

const formOpen = ref(false)
const editing = ref<Product | null>(null)
const formKey = ref(0)
const formSaving = ref(false)
const formCategories = ref<Category[]>([])
const loadingId = ref<string | null>(null)

async function ensureCategories() {
  if (!formCategories.value.length) formCategories.value = await $fetch<Category[]>('/api/categories')
}

async function openCreate() {
  try {
    await ensureCategories()
    editing.value = null
    formKey.value++
    formOpen.value = true
  } catch (err) {
    toast.add({ title: 'Lỗi', description: errorMessage(err, 'Không thể tải danh mục'), color: 'error' })
  }
}

async function openEdit(id: string) {
  loadingId.value = id
  try {
    const [combo] = await Promise.all([$fetch<Product>(`/api/products/${id}`), ensureCategories()])
    editing.value = combo
    formKey.value++
    formOpen.value = true
  } catch (err) {
    toast.add({ title: 'Lỗi', description: errorMessage(err, 'Không thể tải combo'), color: 'error' })
  } finally {
    loadingId.value = null
  }
}

async function saveCombo(payload: Record<string, unknown>) {
  formSaving.value = true
  try {
    if (editing.value) {
      await $fetch(`/api/combos/${editing.value.id}`, { method: 'PATCH', body: payload })
      toast.add({ title: 'Đã lưu combo', color: 'success' })
    } else {
      await $fetch('/api/combos', { method: 'POST', body: payload })
      toast.add({ title: 'Đã tạo combo', color: 'success' })
    }
    formOpen.value = false
    await refresh()
  } catch (err) {
    toast.add({ title: 'Lỗi', description: errorMessage(err, 'Không thể lưu combo'), color: 'error' })
  } finally {
    formSaving.value = false
  }
}

// ---------------------------------------------------------------------------
// Ẩn / khôi phục / xoá vĩnh viễn — dùng chung endpoint sản phẩm (combo là Product)
// ---------------------------------------------------------------------------

const busyId = ref<string | null>(null)

async function hideCombo(combo: Product) {
  const ok = await confirm({ title: `Ẩn combo "${combo.name}"?`, description: 'Combo sẽ ngừng hiển thị trên cửa hàng, bạn có thể khôi phục sau.', confirmLabel: 'Ẩn' })
  if (!ok) return
  busyId.value = combo.id
  try {
    await $fetch(`/api/products/${combo.id}`, { method: 'DELETE' })
    toast.add({ title: 'Đã ẩn combo', color: 'success' })
    await refresh()
  } catch (err) {
    toast.add({ title: 'Lỗi', description: errorMessage(err, 'Không thể ẩn combo'), color: 'error' })
  } finally {
    busyId.value = null
  }
}

async function restoreCombo(combo: Product) {
  busyId.value = combo.id
  try {
    await $fetch(`/api/combos/${combo.id}`, { method: 'PATCH', body: { status: 'ACTIVE' } })
    toast.add({ title: 'Đã khôi phục combo', color: 'success' })
    await refresh()
  } catch (err) {
    toast.add({ title: 'Lỗi', description: errorMessage(err, 'Không thể khôi phục combo'), color: 'error' })
  } finally {
    busyId.value = null
  }
}

async function hardDeleteCombo(combo: Product) {
  const ok = await confirm({ title: `Xoá vĩnh viễn combo "${combo.name}"?` })
  if (!ok) return
  busyId.value = combo.id
  try {
    await $fetch(`/api/products/${combo.id}/permanent`, { method: 'DELETE' })
    toast.add({ title: 'Đã xoá vĩnh viễn combo', color: 'success' })
    await refresh()
  } catch (err) {
    toast.add({ title: 'Lỗi', description: errorMessage(err, 'Không thể xoá combo'), color: 'error' })
  } finally {
    busyId.value = null
  }
}

useSeoMeta({ title: 'Combo / Ưu đãi - Cá Nhà Biển Admin' })
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold text-highlighted">
          Combo / Ưu đãi
        </h1>
        <p class="text-sm text-muted">
          Gộp nhiều sản phẩm thành 1 combo giá ưu đãi — hiển thị đầu tiên ở trang chủ, ngay dưới mã khuyến mãi.
        </p>
      </div>
      <UButton icon="i-lucide-plus" @click="openCreate">
        Thêm combo
      </UButton>
    </div>

    <form class="max-w-sm" @submit.prevent="submitSearch">
      <UInput v-model="searchInput" icon="i-lucide-search" placeholder="Tìm combo..." class="w-full" />
    </form>

    <div class="overflow-x-auto rounded-xl border border-default">
      <table class="w-full text-sm">
        <thead class="bg-elevated text-left text-xs uppercase text-muted">
          <tr>
            <th class="px-4 py-3">
              Combo
            </th>
            <th class="px-4 py-3">
              Gồm
            </th>
            <th class="px-4 py-3 text-right">
              Giá gốc
            </th>
            <th class="px-4 py-3 text-right">
              Giảm
            </th>
            <th class="px-4 py-3 text-right">
              Giá bán
            </th>
            <th class="px-4 py-3 text-right">
              Tồn kho
            </th>
            <th class="px-4 py-3">
              Trạng thái
            </th>
            <th class="px-4 py-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr v-for="combo in data?.data ?? []" :key="combo.id">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <img
                  :src="combo.images[0]?.url ?? '/images/placeholder-fish.svg'"
                  :alt="combo.name"
                  class="size-10 rounded object-cover"
                >
                <span class="font-medium text-highlighted">{{ combo.name }}</span>
              </div>
            </td>
            <td class="px-4 py-3 text-muted">
              <ul class="space-y-0.5">
                <li v-for="item in combo.comboItems" :key="item.id">
                  {{ item.quantity }} × {{ item.variant.product.name }} ({{ item.variant.unit }})
                </li>
              </ul>
            </td>
            <td class="px-4 py-3 text-right text-muted">
              {{ formatVnd(combo.compareAtPrice ?? combo.price) }}
            </td>
            <td class="px-4 py-3 text-right text-error">
              {{ Number(combo.comboDiscount ?? 0) > 0 ? `-${formatVnd(combo.comboDiscount)}` : '—' }}
            </td>
            <td class="px-4 py-3 text-right font-semibold text-highlighted">
              {{ formatVnd(combo.price) }}
            </td>
            <td class="px-4 py-3 text-right">
              {{ combo.stock }}
            </td>
            <td class="px-4 py-3">
              <UBadge :color="combo.deletedAt ? 'error' : combo.status === 'ACTIVE' ? 'success' : 'neutral'">
                {{ combo.deletedAt ? 'Đã ẩn' : combo.status === 'ACTIVE' ? 'Đang bán' : 'Ngừng bán' }}
              </UBadge>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex justify-end gap-2">
                <UButton
                  icon="i-lucide-pencil"
                  size="sm"
                  variant="ghost"
                  :loading="loadingId === combo.id"
                  @click="openEdit(combo.id)"
                />
                <template v-if="combo.deletedAt">
                  <UButton
                    icon="i-lucide-rotate-ccw"
                    size="sm"
                    variant="ghost"
                    :loading="busyId === combo.id"
                    @click="restoreCombo(combo)"
                  />
                  <UButton
                    icon="i-lucide-trash-2"
                    size="sm"
                    variant="ghost"
                    color="error"
                    :loading="busyId === combo.id"
                    @click="hardDeleteCombo(combo)"
                  />
                </template>
                <UButton
                  v-else
                  icon="i-lucide-eye-off"
                  size="sm"
                  variant="ghost"
                  color="error"
                  :loading="busyId === combo.id"
                  @click="hideCombo(combo)"
                />
              </div>
            </td>
          </tr>
          <tr v-if="!data?.data.length">
            <td colspan="8" class="px-4 py-10 text-center text-muted">
              Chưa có combo nào
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
      v-model:open="formOpen"
      :title="editing ? `Sửa combo: ${editing.name}` : 'Thêm combo'"
      :dismissible="!formSaving"
      :ui="{ content: 'sm:max-w-4xl' }"
    >
      <template #body>
        <AdminComboForm
          :key="formKey"
          :categories="formCategories"
          :initial="editing ?? undefined"
          :loading="formSaving"
          @submit="saveCombo"
          @cancel="formOpen = false"
        />
      </template>
    </UModal>
  </div>
</template>
