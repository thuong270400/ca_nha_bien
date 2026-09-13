<script setup lang="ts">
import type { Category } from '#shared/types/catalog'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { data: categories, refresh } = await useFetch<Category[]>('/api/categories', { key: 'admin-categories-full' })

const toast = useToast()
const open = ref(false)
const saving = ref(false)
const editing = ref<Category | null>(null)

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

const confirm = useConfirm()
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

useSeoMeta({ title: 'Danh mục - Cá Nhà Biển Admin' })
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold text-highlighted">
          Danh mục
        </h1>
      </div>
      <UButton icon="i-lucide-plus" @click="openCreate">
        Thêm danh mục
      </UButton>
    </div>

    <div class="overflow-x-auto rounded-xl border border-default">
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
            <td colspan="6" class="px-4 py-10 text-center text-muted">
              Chưa có danh mục nào
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
  </div>
</template>
