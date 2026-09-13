<script setup lang="ts">
import type { Tag } from '#shared/types/catalog'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { data: tags, refresh } = await useFetch<Tag[]>('/api/tags', { key: 'admin-tags' })

const toast = useToast()
const open = ref(false)
const saving = ref(false)
const editing = ref<Tag | null>(null)

const form = reactive({ name: '', slug: '', color: TAG_COLOR_PRESETS[0]!, showOnImage: false })
const positionOptions = [
  { label: 'Đè lên ảnh sản phẩm', value: true },
  { label: 'Nhãn dưới tên sản phẩm (mặc định)', value: false },
]
const slugTouched = ref(false)
const colorError = ref('')
const hexPattern = /^#[0-9A-Fa-f]{6}$/

watch(() => form.name, (name) => {
  if (!slugTouched.value) form.slug = slugify(name)
})

watch(() => form.color, (color) => {
  colorError.value = hexPattern.test(color) ? '' : 'Mã màu không hợp lệ (dạng #RRGGBB)'
})

function openCreate() {
  editing.value = null
  form.name = ''
  form.slug = ''
  form.color = TAG_COLOR_PRESETS[0]!
  form.showOnImage = false
  slugTouched.value = false
  open.value = true
}

function openEdit(tag: Tag) {
  editing.value = tag
  form.name = tag.name
  form.slug = tag.slug
  form.color = tag.color
  form.showOnImage = tag.showOnImage
  slugTouched.value = true
  open.value = true
}

async function save() {
  if (!hexPattern.test(form.color)) return
  saving.value = true
  try {
    const payload = { name: form.name, slug: form.slug, color: form.color, showOnImage: form.showOnImage }
    if (editing.value) {
      await $fetch(`/api/tags/${editing.value.id}`, { method: 'PATCH', body: payload })
    } else {
      await $fetch('/api/tags', { method: 'POST', body: payload })
    }
    toast.add({ title: 'Đã lưu tag', color: 'success' })
    open.value = false
    await refresh()
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể lưu tag'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    saving.value = false
  }
}

const confirm = useConfirm()
const deletingId = ref<string | null>(null)
async function remove(tag: Tag) {
  const ok = await confirm({ title: `Xoá tag "${tag.name}"?` })
  if (!ok) return
  deletingId.value = tag.id
  try {
    await $fetch(`/api/tags/${tag.id}`, { method: 'DELETE' })
    toast.add({ title: 'Đã xoá tag', color: 'success' })
    await refresh()
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể xoá tag'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    deletingId.value = null
  }
}

useSeoMeta({ title: 'Tag - Cá Nhà Biển Admin' })
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-xl font-bold text-highlighted">
        Tag sản phẩm
      </h1>
      <UButton icon="i-lucide-plus" @click="openCreate">
        Thêm tag
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
              Màu
            </th>
            <th class="px-4 py-3">
              Vị trí
            </th>
            <th class="px-4 py-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr v-for="tag in tags ?? []" :key="tag.id">
            <td class="px-4 py-3 font-medium text-highlighted">
              {{ tag.name }}
            </td>
            <td class="px-4 py-3 text-muted">
              {{ tag.slug }}
            </td>
            <td class="px-4 py-3">
              <span
                class="inline-flex items-center gap-2 rounded px-2.5 py-1 text-xs font-medium"
                :style="{ backgroundColor: tag.color, color: tagTextColor(tag.color) }"
              >
                <span class="size-2 rounded-full" :style="{ backgroundColor: tagTextColor(tag.color) }" />
                {{ tag.color }}
              </span>
            </td>
            <td class="px-4 py-3 text-muted">
              {{ tag.showOnImage ? 'Đè lên ảnh' : 'Dưới tên SP' }}
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex justify-end gap-2">
                <UButton icon="i-lucide-pencil" size="sm" variant="ghost" @click="openEdit(tag)" />
                <UButton
                  icon="i-lucide-trash-2"
                  size="sm"
                  variant="ghost"
                  color="error"
                  :loading="deletingId === tag.id"
                  @click="remove(tag)"
                />
              </div>
            </td>
          </tr>
          <tr v-if="!tags?.length">
            <td colspan="5" class="px-4 py-10 text-center text-muted">
              Chưa có tag nào
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <UModal v-model:open="open" :title="editing ? 'Sửa tag' : 'Thêm tag'">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Tên tag" required>
            <UInput v-model="form.name" class="w-full" />
          </UFormField>
          <UFormField label="Slug" required>
            <UInput v-model="form.slug" class="w-full" @input="slugTouched = true" />
          </UFormField>
          <UFormField label="Màu tag" :error="colorError">
            <div class="space-y-3">
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="preset in TAG_COLOR_PRESETS"
                  :key="preset"
                  type="button"
                  class="size-7 rounded-full border-2 transition"
                  :class="form.color.toLowerCase() === preset.toLowerCase() ? 'border-highlighted' : 'border-transparent'"
                  :style="{ backgroundColor: preset }"
                  :aria-label="preset"
                  @click="form.color = preset"
                />
              </div>
              <div class="flex items-center gap-2">
                <input
                  v-model="form.color"
                  type="color"
                  class="size-9 shrink-0 cursor-pointer rounded border border-default bg-transparent p-0.5"
                >
                <UInput v-model="form.color" placeholder="#6B7280" class="w-full font-mono" />
              </div>
              <span
                class="inline-flex items-center rounded px-3 py-1 text-xs font-medium"
                :style="{ backgroundColor: hexPattern.test(form.color) ? form.color : '#6B7280', color: tagTextColor(hexPattern.test(form.color) ? form.color : '#6B7280') }"
              >
                {{ form.name || 'Xem trước tag' }}
              </span>
            </div>
          </UFormField>
          <UFormField label="Vị trí hiển thị">
            <URadioGroup v-model="form.showOnImage" :items="positionOptions" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="outline" @click="open = false">
            Huỷ
          </UButton>
          <UButton :loading="saving" :disabled="!!colorError" @click="save">
            Lưu
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
