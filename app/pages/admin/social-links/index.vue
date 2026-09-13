<script setup lang="ts">
import type { SocialLink } from '#shared/types/content'
import { SOCIAL_ICON_PRESETS, SOCIAL_ICON_SIZES } from '#shared/types/content'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { data: links, refresh } = await useFetch<SocialLink[]>('/api/admin/social-links', { key: 'admin-social-links' })

const toast = useToast()
const open = ref(false)
const saving = ref(false)
const uploading = ref(false)
const editing = ref<SocialLink | null>(null)

const iconTypeOptions = [
  { label: 'Icon có sẵn', value: 'PRESET' as const },
  { label: 'Tải ảnh lên', value: 'CUSTOM' as const },
]

const displayLocationOptions = [
  { label: 'Footer (mặc định)', value: 'FOOTER' as const },
  { label: 'Cố định bên phải màn hình', value: 'FIXED' as const },
]

function displayLocationLabel(value: 'FOOTER' | 'FIXED') {
  return value === 'FIXED' ? 'Cố định' : 'Footer'
}

const sizeOptions = SOCIAL_ICON_SIZES.map(size => ({ label: size.label, value: size.key }))

const form = reactive({
  label: '',
  url: '',
  iconType: 'PRESET' as 'PRESET' | 'CUSTOM',
  iconKey: SOCIAL_ICON_PRESETS[0].key as string,
  imageUrl: '',
  displayLocation: 'FOOTER' as 'FOOTER' | 'FIXED',
  size: 'MEDIUM' as 'SMALL' | 'MEDIUM' | 'LARGE' | 'XLARGE' | 'XXLARGE',
  position: 0,
  isActive: true,
})

function iconFor(key: string | null | undefined) {
  return SOCIAL_ICON_PRESETS.find(preset => preset.key === key)?.icon ?? 'i-lucide-link'
}

function sizeOf(size: string) {
  return SOCIAL_ICON_SIZES.find(s => s.key === size) ?? SOCIAL_ICON_SIZES[1]
}

function openCreate() {
  editing.value = null
  form.label = ''
  form.url = ''
  form.iconType = 'PRESET'
  form.iconKey = SOCIAL_ICON_PRESETS[0].key
  form.imageUrl = ''
  form.displayLocation = 'FOOTER'
  form.size = 'MEDIUM'
  form.position = 0
  form.isActive = true
  open.value = true
}

function openEdit(link: SocialLink) {
  editing.value = link
  form.label = link.label ?? ''
  form.url = link.url
  form.iconType = link.iconType
  form.iconKey = link.iconKey ?? SOCIAL_ICON_PRESETS[0].key
  form.imageUrl = link.imageUrl ?? ''
  form.displayLocation = link.displayLocation
  form.size = link.size
  form.position = link.position
  form.isActive = link.isActive
  open.value = true
}

async function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const body = new FormData()
    body.append('file', file)
    body.append('folder', 'social-links')
    const res = await $fetch<{ url: string }>('/api/admin/uploads', { method: 'POST', body })
    if (form.imageUrl && form.imageUrl !== (editing.value?.imageUrl ?? '')) {
      deleteUploadedImage(form.imageUrl)
    }
    form.imageUrl = res.url
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Tải ảnh thất bại'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    uploading.value = false
    input.value = ''
  }
}

async function save() {
  saving.value = true
  try {
    const payload = {
      label: form.label || undefined,
      url: form.url,
      iconType: form.iconType,
      iconKey: form.iconType === 'PRESET' ? form.iconKey : null,
      imageUrl: form.iconType === 'CUSTOM' ? form.imageUrl : null,
      displayLocation: form.displayLocation,
      size: form.size,
      position: form.position,
      isActive: form.isActive,
    }
    if (editing.value) {
      await $fetch(`/api/admin/social-links/${editing.value.id}`, { method: 'PATCH', body: payload })
    } else {
      await $fetch('/api/admin/social-links', { method: 'POST', body: payload })
    }
    toast.add({ title: 'Đã lưu liên kết', color: 'success' })
    open.value = false
    await refresh()
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể lưu liên kết'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    saving.value = false
  }
}

const confirm = useConfirm()
const deletingId = ref<string | null>(null)
async function remove(link: SocialLink) {
  const ok = await confirm({ title: `Xoá liên kết "${link.label || link.url}"?` })
  if (!ok) return
  deletingId.value = link.id
  try {
    await $fetch(`/api/admin/social-links/${link.id}`, { method: 'DELETE' })
    toast.add({ title: 'Đã xoá liên kết', color: 'success' })
    await refresh()
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể xoá liên kết'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    deletingId.value = null
  }
}

useSeoMeta({ title: 'Mạng xã hội - Cá Nhà Biển Admin' })
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-xl font-bold text-highlighted">
        Liên kết mạng xã hội
      </h1>
      <UButton icon="i-lucide-plus" @click="openCreate">
        Thêm liên kết
      </UButton>
    </div>

    <div class="overflow-x-auto rounded-xl border border-default">
      <table class="w-full text-sm">
        <thead class="bg-elevated text-left text-xs uppercase text-muted">
          <tr>
            <th class="px-4 py-3">Icon</th>
            <th class="px-4 py-3">Tên</th>
            <th class="px-4 py-3">Liên kết</th>
            <th class="px-4 py-3">Vị trí</th>
            <th class="px-4 py-3">Cỡ</th>
            <th class="px-4 py-3">Thứ tự</th>
            <th class="px-4 py-3">Trạng thái</th>
            <th class="px-4 py-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr v-for="link in links ?? []" :key="link.id">
            <td class="px-4 py-3">
              <div class="flex size-10 items-center justify-center overflow-hidden rounded-full border border-default bg-elevated">
                <img v-if="link.iconType === 'CUSTOM' && link.imageUrl" :src="link.imageUrl" alt="" class="size-full object-cover">
                <UIcon v-else :name="iconFor(link.iconKey)" class="size-5" />
              </div>
            </td>
            <td class="px-4 py-3 font-medium text-highlighted">
              {{ link.label || '(không có tên)' }}
            </td>
            <td class="max-w-xs truncate px-4 py-3 text-muted">
              {{ link.url }}
            </td>
            <td class="px-4 py-3">
              <UBadge color="neutral" variant="subtle">
                {{ displayLocationLabel(link.displayLocation) }}
              </UBadge>
            </td>
            <td class="px-4 py-3 text-muted">
              {{ sizeOf(link.size).label }}
            </td>
            <td class="px-4 py-3 text-muted">
              {{ link.position }}
            </td>
            <td class="px-4 py-3">
              <UBadge :color="link.isActive ? 'success' : 'neutral'">
                {{ link.isActive ? 'Hiển thị' : 'Ẩn' }}
              </UBadge>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex justify-end gap-2">
                <UButton icon="i-lucide-pencil" size="sm" variant="ghost" @click="openEdit(link)" />
                <UButton
                  icon="i-lucide-trash-2"
                  size="sm"
                  variant="ghost"
                  color="error"
                  :loading="deletingId === link.id"
                  @click="remove(link)"
                />
              </div>
            </td>
          </tr>
          <tr v-if="!links?.length">
            <td colspan="8" class="px-4 py-10 text-center text-muted">
              Chưa có liên kết nào
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <UModal v-model:open="open" :title="editing ? 'Sửa liên kết' : 'Thêm liên kết'">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Tên gợi nhớ">
            <UInput v-model="form.label" placeholder="Facebook Cá Nhà Biển" class="w-full" />
          </UFormField>
          <UFormField label="URL" required>
            <UInput v-model="form.url" placeholder="https://facebook.com/..." class="w-full" />
          </UFormField>
          <UFormField label="Icon">
            <URadioGroup v-model="form.iconType" :items="iconTypeOptions" orientation="horizontal" />
          </UFormField>

          <div v-if="form.iconType === 'PRESET'" class="flex flex-wrap gap-2">
            <button
              v-for="preset in SOCIAL_ICON_PRESETS"
              :key="preset.key"
              type="button"
              class="flex size-11 items-center justify-center rounded-full border-2 transition"
              :class="form.iconKey === preset.key ? 'border-primary bg-primary/10' : 'border-default'"
              :aria-label="preset.label"
              @click="form.iconKey = preset.key"
            >
              <UIcon :name="preset.icon" class="size-5" />
            </button>
          </div>

          <div v-else class="flex items-center gap-3">
            <div class="flex size-14 items-center justify-center overflow-hidden rounded-full border border-default bg-elevated">
              <img v-if="form.imageUrl" :src="form.imageUrl" alt="" class="size-full object-cover">
              <UIcon v-else name="i-lucide-image" class="size-5 text-muted" />
            </div>
            <label class="cursor-pointer">
              <UButton :loading="uploading" icon="i-lucide-upload" size="sm" variant="outline" as="span">
                Tải ảnh lên
              </UButton>
              <input type="file" accept="image/*" class="hidden" @change="onFileSelected">
            </label>
          </div>

          <UFormField label="Vị trí hiển thị">
            <URadioGroup v-model="form.displayLocation" :items="displayLocationOptions" />
          </UFormField>
          <UFormField label="Kích thước icon">
            <div class="flex items-center gap-4">
              <URadioGroup v-model="form.size" :items="sizeOptions" orientation="horizontal" />
              <div
                class="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-inverted text-inverted"
                :style="{ width: `${sizeOf(form.size).box}px`, height: `${sizeOf(form.size).box}px` }"
              >
                <img v-if="form.iconType === 'CUSTOM' && form.imageUrl" :src="form.imageUrl" alt="" class="size-full object-cover">
                <UIcon v-else :name="iconFor(form.iconKey)" :style="{ width: `${sizeOf(form.size).icon}px`, height: `${sizeOf(form.size).icon}px` }" />
              </div>
            </div>
          </UFormField>
          <UFormField label="Thứ tự hiển thị">
            <UInputNumber v-model="form.position" :min="0" />
          </UFormField>
          <UCheckbox v-model="form.isActive" label="Hiển thị trên website" />
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="outline" @click="open = false">
            Huỷ
          </UButton>
          <UButton
            :loading="saving"
            :disabled="!form.url || (form.iconType === 'CUSTOM' && !form.imageUrl)"
            @click="save"
          >
            Lưu
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
