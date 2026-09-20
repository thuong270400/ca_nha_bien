<script setup lang="ts">
import type { Category } from '#shared/types/catalog'
import type { CouponCategoryView } from '#shared/types/coupon'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const toast = useToast()
const confirm = useConfirm()

const tabItems = [
  { label: 'Danh mục sản phẩm', value: 'products' },
  { label: 'Danh mục mã giảm giá', value: 'coupons' },
]
const activeTab = ref<string | number>('products')

// ---------------------------------------------------------------------------
// Danh mục sản phẩm
// ---------------------------------------------------------------------------

const { data: categories, refresh } = await useFetch<Category[]>('/api/categories', { key: 'admin-categories-full' })

const open = ref(false)
const saving = ref(false)
const editing = ref<Category | null>(null)

const sortOptions = [
  { label: 'Mới nhất', value: 'newest' },
  { label: 'Cũ nhất', value: 'oldest' },
  { label: 'Giá tăng dần', value: 'price_asc' },
  { label: 'Giá giảm dần', value: 'price_desc' },
  { label: 'Tên A-Z', value: 'name_asc' },
  { label: 'Tồn kho nhiều nhất', value: 'stock_desc' },
  { label: 'Tồn kho ít nhất', value: 'stock_asc' },
]

const form = reactive({
  name: '',
  slug: '',
  description: '',
  imageUrl: '',
  isActive: true,
  isFeatured: false,
  limitProducts: false,
  homepageLimit: 8,
  position: 0,
  defaultSort: 'newest',
})
const slugTouched = ref(false)

watch(() => form.name, (name) => {
  if (!slugTouched.value) form.slug = slugify(name)
})

function openCreate() {
  editing.value = null
  form.name = ''
  form.slug = ''
  form.description = ''
  form.imageUrl = ''
  form.isActive = true
  form.isFeatured = false
  form.limitProducts = false
  form.homepageLimit = 8
  form.position = Math.max(0, ...(categories.value ?? []).map((c: Category) => c.position)) + 1
  form.defaultSort = 'newest'
  slugTouched.value = false
  open.value = true
}

function openEdit(category: Category) {
  editing.value = category
  form.name = category.name
  form.slug = category.slug
  form.description = category.description ?? ''
  form.imageUrl = category.imageUrl ?? ''
  form.isActive = category.isActive
  form.isFeatured = category.isFeatured
  form.limitProducts = category.homepageLimit !== null
  form.homepageLimit = category.homepageLimit ?? 8
  form.position = category.position
  form.defaultSort = category.defaultSort
  slugTouched.value = true
  open.value = true
}

async function save() {
  saving.value = true
  try {
    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description || undefined,
      imageUrl: form.imageUrl || undefined,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      homepageLimit: form.limitProducts ? form.homepageLimit : null,
      position: form.position,
      defaultSort: form.defaultSort,
    }
    if (editing.value) {
      await $fetch(`/api/categories/${editing.value.id}`, { method: 'PATCH', body: payload })
    } else {
      await $fetch('/api/categories', { method: 'POST', body: payload })
    }
    toast.add({ title: 'Đã lưu danh mục', color: 'success' })
    open.value = false
    await refresh()
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể lưu danh mục'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    saving.value = false
  }
}

const deletingId = ref<string | null>(null)
async function remove(category: Category) {
  const ok = await confirm({ title: `Xoá danh mục "${category.name}"?` })
  if (!ok) return
  deletingId.value = category.id
  try {
    await $fetch(`/api/categories/${category.id}`, { method: 'DELETE' })
    toast.add({ title: 'Đã xoá danh mục', color: 'success' })
    await refresh()
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể xoá danh mục'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    deletingId.value = null
  }
}

const reorderingId = ref<string | null>(null)
async function move(category: Category, direction: 'up' | 'down') {
  const list = categories.value ?? []
  const index = list.findIndex(c => c.id === category.id)
  const targetIndex = direction === 'up' ? index - 1 : index + 1
  const target = list[targetIndex]
  if (!target) return

  reorderingId.value = category.id
  try {
    await Promise.all([
      $fetch(`/api/categories/${category.id}`, { method: 'PATCH', body: { position: target.position } }),
      $fetch(`/api/categories/${target.id}`, { method: 'PATCH', body: { position: category.position } }),
    ])
    await refresh()
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể thay đổi thứ tự'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    reorderingId.value = null
  }
}

// ---------------------------------------------------------------------------
// Danh mục mã giảm giá
// ---------------------------------------------------------------------------

const { data: couponCategories, refresh: refreshCouponCategories } = await useFetch<CouponCategoryView[]>('/api/coupon-categories', { key: 'admin-coupon-categories-full' })

const ccOpen = ref(false)
const ccSaving = ref(false)
const ccEditing = ref<CouponCategoryView | null>(null)
const ccForm = reactive({
  name: '',
  slug: '',
  isActive: true,
  position: 0,
})
const ccSlugTouched = ref(false)

watch(() => ccForm.name, (name) => {
  if (!ccSlugTouched.value) ccForm.slug = slugify(name)
})

function openCcCreate() {
  ccEditing.value = null
  ccForm.name = ''
  ccForm.slug = ''
  ccForm.isActive = true
  ccForm.position = Math.max(0, ...(couponCategories.value ?? []).map(c => c.position)) + 1
  ccSlugTouched.value = false
  ccOpen.value = true
}

function openCcEdit(category: CouponCategoryView) {
  ccEditing.value = category
  ccForm.name = category.name
  ccForm.slug = category.slug
  ccForm.isActive = category.isActive
  ccForm.position = category.position
  ccSlugTouched.value = true
  ccOpen.value = true
}

async function saveCc() {
  ccSaving.value = true
  try {
    const payload = {
      name: ccForm.name,
      slug: ccForm.slug,
      isActive: ccForm.isActive,
      position: ccForm.position,
    }
    if (ccEditing.value) {
      await $fetch(`/api/coupon-categories/${ccEditing.value.id}`, { method: 'PATCH', body: payload })
    } else {
      await $fetch('/api/coupon-categories', { method: 'POST', body: payload })
    }
    toast.add({ title: 'Đã lưu danh mục mã giảm giá', color: 'success' })
    ccOpen.value = false
    await refreshCouponCategories()
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể lưu danh mục'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    ccSaving.value = false
  }
}

const ccDeletingId = ref<string | null>(null)
async function removeCc(category: CouponCategoryView) {
  const ok = await confirm({ title: `Xoá danh mục "${category.name}"?` })
  if (!ok) return
  ccDeletingId.value = category.id
  try {
    await $fetch(`/api/coupon-categories/${category.id}`, { method: 'DELETE' })
    toast.add({ title: 'Đã xoá danh mục', color: 'success' })
    await refreshCouponCategories()
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể xoá danh mục'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    ccDeletingId.value = null
  }
}

const ccReorderingId = ref<string | null>(null)
async function moveCc(category: CouponCategoryView, direction: 'up' | 'down') {
  const list = couponCategories.value ?? []
  const index = list.findIndex(c => c.id === category.id)
  const targetIndex = direction === 'up' ? index - 1 : index + 1
  const target = list[targetIndex]
  if (!target) return

  ccReorderingId.value = category.id
  try {
    await Promise.all([
      $fetch(`/api/coupon-categories/${category.id}`, { method: 'PATCH', body: { position: target.position } }),
      $fetch(`/api/coupon-categories/${target.id}`, { method: 'PATCH', body: { position: category.position } }),
    ])
    await refreshCouponCategories()
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể thay đổi thứ tự'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    ccReorderingId.value = null
  }
}

useSeoMeta({ title: 'Danh mục - Cá Nhà Biển Admin' })
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-xl font-bold text-highlighted">
        Danh mục
      </h1>
      <UButton
        icon="i-lucide-plus"
        @click="activeTab === 'products' ? openCreate() : openCcCreate()"
      >
        {{ activeTab === 'products' ? 'Thêm danh mục' : 'Thêm danh mục mã giảm giá' }}
      </UButton>
    </div>

    <UTabs v-model="activeTab" :items="tabItems" :content="false" />

    <div v-if="activeTab === 'products'" class="overflow-x-auto rounded-xl border border-default">
      <table class="w-full text-sm">
        <thead class="bg-elevated text-left text-xs uppercase text-muted">
          <tr>
            <th class="px-4 py-3">
              Thứ tự
            </th>
            <th class="px-4 py-3">
              Tên
            </th>
            <th class="px-4 py-3">
              Slug
            </th>
            <th class="px-4 py-3">
              Trạng thái
            </th>
            <th class="px-4 py-3">
              Trang chủ
            </th>
            <th class="px-4 py-3">
              Sắp xếp
            </th>
            <th class="px-4 py-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr v-for="(category, i) in categories ?? []" :key="category.id">
            <td class="px-4 py-3">
              <div class="flex items-center gap-1">
                <span class="w-6 text-muted">{{ category.position }}</span>
                <UButton
                  icon="i-lucide-chevron-up"
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  :disabled="i === 0"
                  :loading="reorderingId === category.id"
                  @click="move(category, 'up')"
                />
                <UButton
                  icon="i-lucide-chevron-down"
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  :disabled="i === (categories?.length ?? 0) - 1"
                  :loading="reorderingId === category.id"
                  @click="move(category, 'down')"
                />
              </div>
            </td>
            <td class="px-4 py-3 font-medium text-highlighted">
              {{ category.name }}
            </td>
            <td class="px-4 py-3 text-muted">
              {{ category.slug }}
            </td>
            <td class="px-4 py-3">
              <UBadge :color="category.isActive ? 'success' : 'neutral'">
                {{ category.isActive ? 'Hiển thị' : 'Ẩn' }}
              </UBadge>
            </td>
            <td class="px-4 py-3">
              <div v-if="category.isFeatured" class="flex items-center gap-2">
                <UBadge color="primary">
                  Đang hiển thị
                </UBadge>
                <span class="text-xs text-muted">
                  {{ category.homepageLimit ? `Tối đa ${category.homepageLimit} sản phẩm` : 'Tất cả sản phẩm' }}
                </span>
              </div>
            </td>
            <td class="px-4 py-3 text-muted">
              {{ sortOptions.find(o => o.value === category.defaultSort)?.label ?? category.defaultSort }}
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex justify-end gap-2">
                <UButton icon="i-lucide-pencil" size="sm" variant="ghost" @click="openEdit(category)" />
                <UButton
                  icon="i-lucide-trash-2"
                  size="sm"
                  variant="ghost"
                  color="error"
                  :loading="deletingId === category.id"
                  @click="remove(category)"
                />
              </div>
            </td>
          </tr>
          <tr v-if="!categories?.length">
            <td colspan="7" class="px-4 py-10 text-center text-muted">
              Chưa có danh mục nào
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="overflow-x-auto rounded-xl border border-default">
      <table class="w-full text-sm">
        <thead class="bg-elevated text-left text-xs uppercase text-muted">
          <tr>
            <th class="px-4 py-3">
              Thứ tự
            </th>
            <th class="px-4 py-3">
              Tên
            </th>
            <th class="px-4 py-3">
              Slug
            </th>
            <th class="px-4 py-3">
              Trạng thái
            </th>
            <th class="px-4 py-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr v-for="(category, i) in couponCategories ?? []" :key="category.id">
            <td class="px-4 py-3">
              <div class="flex items-center gap-1">
                <span class="w-6 text-muted">{{ category.position }}</span>
                <UButton
                  icon="i-lucide-chevron-up"
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  :disabled="i === 0"
                  :loading="ccReorderingId === category.id"
                  @click="moveCc(category, 'up')"
                />
                <UButton
                  icon="i-lucide-chevron-down"
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  :disabled="i === (couponCategories?.length ?? 0) - 1"
                  :loading="ccReorderingId === category.id"
                  @click="moveCc(category, 'down')"
                />
              </div>
            </td>
            <td class="px-4 py-3 font-medium text-highlighted">
              {{ category.name }}
            </td>
            <td class="px-4 py-3 text-muted">
              {{ category.slug }}
            </td>
            <td class="px-4 py-3">
              <UBadge :color="category.isActive ? 'success' : 'neutral'">
                {{ category.isActive ? 'Hiển thị' : 'Ẩn' }}
              </UBadge>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex justify-end gap-2">
                <UButton icon="i-lucide-pencil" size="sm" variant="ghost" @click="openCcEdit(category)" />
                <UButton
                  icon="i-lucide-trash-2"
                  size="sm"
                  variant="ghost"
                  color="error"
                  :loading="ccDeletingId === category.id"
                  @click="removeCc(category)"
                />
              </div>
            </td>
          </tr>
          <tr v-if="!couponCategories?.length">
            <td colspan="5" class="px-4 py-10 text-center text-muted">
              Chưa có danh mục mã giảm giá nào
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <UModal v-model:open="open" :title="editing ? 'Sửa danh mục' : 'Thêm danh mục'">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Tên danh mục" required>
            <UInput v-model="form.name" class="w-full" />
          </UFormField>
          <UFormField label="Slug" required>
            <UInput v-model="form.slug" class="w-full" @input="slugTouched = true" />
          </UFormField>
          <UFormField label="Mô tả">
            <UTextarea v-model="form.description" :rows="3" class="w-full" />
          </UFormField>
          <UFormField label="URL ảnh">
            <UInput v-model="form.imageUrl" placeholder="/images/..." class="w-full" />
          </UFormField>
          <UFormField label="Thứ tự hiển thị" description="Số nhỏ hơn hiển thị trước, trên trang chủ và danh sách danh mục">
            <UInputNumber v-model="form.position" :min="0" />
          </UFormField>
          <UFormField label="Sắp xếp sản phẩm" description="Thứ tự mặc định khi hiển thị sản phẩm của danh mục này ở trang chủ và trang danh mục">
            <USelect v-model="form.defaultSort" :items="sortOptions" class="w-full" />
          </UFormField>
          <UCheckbox v-model="form.isActive" label="Hiển thị trên cửa hàng" />
          <UCheckbox
            v-model="form.isFeatured"
            label="Hiển thị trên trang chủ"
          />
          <div v-if="form.isFeatured" class="space-y-3 rounded-lg border border-default p-3">
            <UCheckbox
              v-model="form.limitProducts"
              label="Giới hạn số sản phẩm hiển thị trên trang chủ"
              description="Sản phẩm vượt quá số lượng này sẽ ẩn, kèm nút “Xem tất cả” dẫn đến trang danh mục"
            />
            <UFormField v-if="form.limitProducts" label="Số sản phẩm hiển thị">
              <UInputNumber v-model="form.homepageLimit" :min="1" class="w-full" />
            </UFormField>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="outline" @click="open = false">
            Huỷ
          </UButton>
          <UButton :loading="saving" @click="save">
            Lưu
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="ccOpen" :title="ccEditing ? 'Sửa danh mục mã giảm giá' : 'Thêm danh mục mã giảm giá'">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Tên danh mục" required>
            <UInput v-model="ccForm.name" class="w-full" />
          </UFormField>
          <UFormField label="Slug" required>
            <UInput v-model="ccForm.slug" class="w-full" @input="ccSlugTouched = true" />
          </UFormField>
          <UFormField label="Thứ tự hiển thị" description="Số nhỏ hơn hiển thị trước">
            <UInputNumber v-model="ccForm.position" :min="0" />
          </UFormField>
          <UCheckbox v-model="ccForm.isActive" label="Hoạt động" />
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="outline" @click="ccOpen = false">
            Huỷ
          </UButton>
          <UButton :loading="ccSaving" @click="saveCc">
            Lưu
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
