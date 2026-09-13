<script setup lang="ts">
import type { Banner } from '#shared/types/content'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { data: banners, refresh } = await useFetch<Banner[]>('/api/admin/banners', { key: 'admin-banners' })

const toast = useToast()
const open = ref(false)
const saving = ref(false)
const uploading = ref(false)
const editing = ref<Banner | null>(null)

const linkTypeOptions = [
  { label: 'Trang trong web', value: 'internal' as const },
  { label: 'Trang ngoài', value: 'external' as const },
]

function detectLinkType(link: string | null | undefined): 'internal' | 'external' {
  return link && /^https?:\/\//i.test(link) ? 'external' : 'internal'
}

interface ButtonForm {
  label: string
  link: string
  linkType: 'internal' | 'external'
}

const form = reactive({
  imageUrl: '',
  title: '',
  subtitle: '',
  buttons: [] as ButtonForm[],
  position: 0,
  isActive: true,
})

function addButton() {
  form.buttons.push({ label: '', link: '', linkType: 'internal' })
}

function openCreate() {
  editing.value = null
  form.imageUrl = ''
  form.title = ''
  form.subtitle = ''
  form.buttons = []
  form.position = 0
  form.isActive = true
  open.value = true
}

function openEdit(banner: Banner) {
  editing.value = banner
  form.imageUrl = banner.imageUrl
  form.title = banner.title ?? ''
  form.subtitle = banner.subtitle ?? ''
  form.buttons = banner.buttons.map(b => ({ label: b.label, link: b.link, linkType: detectLinkType(b.link) }))
  form.position = banner.position
  form.isActive = banner.isActive
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
    body.append('folder', 'banners')
    const res = await $fetch<{ url: string }>('/api/admin/uploads', { method: 'POST', body })
    // If the previous image was itself an unsaved upload from this same session
    // (not the persisted one being edited), it's about to be orphaned — clean it up.
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
  const buttons = []
  for (const btn of form.buttons) {
    const label = btn.label.trim()
    const link = btn.link.trim()
    if (!label || !link) {
      toast.add({ title: 'Lỗi', description: 'Vui lòng nhập đầy đủ nhãn và liên kết cho mỗi nút', color: 'error' })
      return
    }
    if (btn.linkType === 'internal' && !link.startsWith('/')) {
      toast.add({ title: 'Lỗi', description: 'Đường dẫn trong web phải bắt đầu bằng /, ví dụ /products', color: 'error' })
      return
    }
    if (btn.linkType === 'external' && !/^https?:\/\//i.test(link)) {
      toast.add({ title: 'Lỗi', description: 'Liên kết trang ngoài phải bắt đầu bằng http:// hoặc https://', color: 'error' })
      return
    }
    buttons.push({ label, link })
  }
  saving.value = true
  try {
    const payload = {
      imageUrl: form.imageUrl,
      title: form.title || undefined,
      subtitle: form.subtitle || undefined,
      buttons,
      position: form.position,
      isActive: form.isActive,
    }
    if (editing.value) {
      await $fetch(`/api/admin/banners/${editing.value.id}`, { method: 'PATCH', body: payload })
    } else {
      await $fetch('/api/admin/banners', { method: 'POST', body: payload })
    }
    toast.add({ title: 'Đã lưu banner', color: 'success' })
    open.value = false
    await refresh()
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể lưu banner'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    saving.value = false
  }
}

const confirm = useConfirm()
const deletingId = ref<string | null>(null)
async function remove(banner: Banner) {
  const ok = await confirm({ title: `Xoá banner "${banner.title || '(không có tiêu đề)'}"?` })
  if (!ok) return
  deletingId.value = banner.id
  try {
    await $fetch(`/api/admin/banners/${banner.id}`, { method: 'DELETE' })
    toast.add({ title: 'Đã xoá banner', color: 'success' })
    await refresh()
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể xoá banner'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    deletingId.value = null
  }
}

useSeoMeta({ title: 'Banner - Cá Nhà Biển Admin' })
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-xl font-bold text-highlighted">
        Banner trang chủ
      </h1>
      <UButton icon="i-lucide-plus" @click="openCreate">
        Thêm banner
      </UButton>
    </div>

    <div class="overflow-x-auto rounded-xl border border-default">
      <table class="w-full text-sm">
        <thead class="bg-elevated text-left text-xs uppercase text-muted">
          <tr>
            <th class="px-4 py-3">Ảnh</th>
            <th class="px-4 py-3">Tiêu đề</th>
            <th class="px-4 py-3">Nút bấm</th>
            <th class="px-4 py-3">Thứ tự</th>
            <th class="px-4 py-3">Trạng thái</th>
            <th class="px-4 py-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr v-for="banner in banners ?? []" :key="banner.id">
            <td class="px-4 py-3">
              <div class="h-12 w-20 overflow-hidden rounded-md bg-elevated">
                <img :src="banner.imageUrl" alt="" class="size-full object-cover">
              </div>
            </td>
            <td class="px-4 py-3 font-medium text-highlighted">
              {{ banner.title || '(không có tiêu đề)' }}
            </td>
            <td class="px-4 py-3 text-muted">
              <span v-if="banner.buttons.length">{{ banner.buttons.map(b => b.label).join(', ') }}</span>
              <span v-else>—</span>
            </td>
            <td class="px-4 py-3 text-muted">
              {{ banner.position }}
            </td>
            <td class="px-4 py-3">
              <UBadge :color="banner.isActive ? 'success' : 'neutral'">
                {{ banner.isActive ? 'Hiển thị' : 'Ẩn' }}
              </UBadge>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex justify-end gap-2">
                <UButton icon="i-lucide-pencil" size="sm" variant="ghost" @click="openEdit(banner)" />
                <UButton
                  icon="i-lucide-trash-2"
                  size="sm"
                  variant="ghost"
                  color="error"
                  :loading="deletingId === banner.id"
                  @click="remove(banner)"
                />
              </div>
            </td>
          </tr>
          <tr v-if="!banners?.length">
            <td colspan="6" class="px-4 py-10 text-center text-muted">
              Chưa có banner nào
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <UModal v-model:open="open" :title="editing ? 'Sửa banner' : 'Thêm banner'">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Ảnh" required>
            <div class="flex items-center gap-3">
              <div v-if="form.imageUrl" class="h-16 w-28 overflow-hidden rounded-md border border-default bg-elevated">
                <img :src="form.imageUrl" alt="" class="size-full object-cover">
              </div>
              <label class="cursor-pointer">
                <UButton :loading="uploading" icon="i-lucide-upload" size="sm" variant="outline" as="span">
                  Tải ảnh lên
                </UButton>
                <input type="file" accept="image/*" class="hidden" @change="onFileSelected">
              </label>
            </div>
          </UFormField>
          <UFormField label="Tiêu đề">
            <UInput v-model="form.title" class="w-full" />
          </UFormField>
          <UFormField label="Mô tả phụ">
            <UTextarea v-model="form.subtitle" :rows="2" class="w-full" />
          </UFormField>
          <UFormField label="Nút bấm">
            <div class="space-y-3">
              <div
                v-for="(btn, idx) in form.buttons"
                :key="idx"
                class="space-y-2 rounded-lg border border-default p-3"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-medium text-muted">Nút {{ idx + 1 }}</span>
                  <UButton
                    icon="i-lucide-x"
                    size="xs"
                    variant="ghost"
                    color="error"
                    @click="form.buttons.splice(idx, 1)"
                  />
                </div>
                <UInput v-model="btn.label" placeholder="Nhãn nút, ví dụ Mua ngay" class="w-full" />
                <URadioGroup v-model="btn.linkType" :items="linkTypeOptions" orientation="horizontal" />
                <UInput
                  v-model="btn.link"
                  :placeholder="btn.linkType === 'internal' ? '/products' : 'https://example.com'"
                  class="w-full"
                />
              </div>
              <UButton icon="i-lucide-plus" size="sm" variant="outline" @click="addButton">
                Thêm nút
              </UButton>
            </div>
          </UFormField>
          <UFormField label="Thứ tự hiển thị">
            <UInputNumber v-model="form.position" :min="0" />
          </UFormField>
          <UCheckbox v-model="form.isActive" label="Hiển thị trên trang chủ" />
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="outline" @click="open = false">
            Huỷ
          </UButton>
          <UButton :loading="saving" :disabled="!form.imageUrl" @click="save">
            Lưu
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
