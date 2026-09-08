<script setup lang="ts">
import type { Category } from '#shared/types/catalog'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { data: categories, refresh } = await useFetch<Category[]>('/api/categories', { key: 'admin-categories-full' })

const toast = useToast()
const open = ref(false)
const saving = ref(false)
const editing = ref<Category | null>(null)

const form = reactive({ name: '', slug: '', description: '', imageUrl: '', isActive: true })
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

useSeoMeta({ title: 'Danh mục - Cá nhà biển Admin' })
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-xl font-bold text-highlighted">
        Danh mục
      </h1>
      <UButton icon="i-lucide-plus" @click="openCreate">
        Thêm danh mục
      </UButton>
    </div>

    <div class="overflow-x-auto rounded-xl border border-default">
      <table class="w-full text-sm">
        <thead class="bg-elevated text-left text-xs uppercase text-muted">
          <tr>
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
          <tr v-for="category in categories ?? []" :key="category.id">
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
            <td colspan="4" class="px-4 py-10 text-center text-muted">
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
          <UCheckbox v-model="form.isActive" label="Hiển thị trên cửa hàng" />
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
