<script setup lang="ts">
import { detectVideoType } from '#shared/utils/video'

interface DishRow {
  id?: string
  name: string
  imageUrl: string | null
  videoUrl: string
}

const dishes = defineModel<DishRow[]>({ default: () => [] })

const toast = useToast()
const uploading = ref(false)
const modalOpen = ref(false)
const editingIndex = ref<number | null>(null)

const form = reactive({ name: '', imageUrl: null as string | null, videoUrl: '' })

function openCreate() {
  editingIndex.value = null
  form.name = ''
  form.imageUrl = null
  form.videoUrl = ''
  modalOpen.value = true
}

function openEdit(idx: number) {
  const dish = dishes.value[idx]
  if (!dish) return
  editingIndex.value = idx
  form.name = dish.name
  form.imageUrl = dish.imageUrl
  form.videoUrl = dish.videoUrl
  modalOpen.value = true
}

async function uploadFile(file: File) {
  if (!file.type.startsWith('image/')) return
  uploading.value = true
  try {
    const body = new FormData()
    body.append('file', file)
    body.append('folder', 'dishes')
    const res = await $fetch<{ url: string }>('/api/admin/uploads', { method: 'POST', body })
    // Uploaded-but-unsaved image being replaced before the dish itself was ever saved.
    if (form.imageUrl) deleteUploadedImage(form.imageUrl)
    form.imageUrl = res.url
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Tải ảnh thất bại'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    uploading.value = false
  }
}

async function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) await uploadFile(file)
  input.value = ''
}

function removeImage() {
  if (form.imageUrl) deleteUploadedImage(form.imageUrl)
  form.imageUrl = null
}

const dragCounter = ref(0)
const isDraggingOver = computed(() => dragCounter.value > 0)

function onDragEnter(e: DragEvent) {
  if (!e.dataTransfer?.types.includes('Files')) return
  dragCounter.value++
}

function onDragLeave() {
  dragCounter.value = Math.max(0, dragCounter.value - 1)
}

function onDrop(e: DragEvent) {
  dragCounter.value = 0
  const file = e.dataTransfer?.files?.[0]
  if (file) uploadFile(file)
}

function saveDish() {
  const name = form.name.trim()
  if (!name) {
    toast.add({ title: 'Lỗi', description: 'Vui lòng nhập tên món', color: 'error' })
    return
  }
  const videoUrl = form.videoUrl.trim()
  if (videoUrl && !/^https?:\/\//i.test(videoUrl)) {
    toast.add({ title: 'Lỗi', description: 'Video phải là một URL hợp lệ (bắt đầu bằng http:// hoặc https://)', color: 'error' })
    return
  }

  if (editingIndex.value !== null) {
    const existing = dishes.value[editingIndex.value]
    dishes.value.splice(editingIndex.value, 1, { id: existing?.id, name, imageUrl: form.imageUrl, videoUrl })
  } else {
    dishes.value.push({ name, imageUrl: form.imageUrl, videoUrl })
  }
  modalOpen.value = false
}

async function removeDish(idx: number) {
  const dish = dishes.value[idx]
  if (!dish) return
  // useConfirm() is created fresh per call (not hoisted to setup) — reusing one
  // handle across repeated confirm() calls in the same session silently fails
  // to reopen the dialog on the 2nd+ call, a pre-existing issue in the shared
  // overlay/ConfirmDialog pattern that's out of scope to fix here.
  const ok = await useConfirm()({ title: `Xoá món "${dish.name}"?` })
  if (!ok) return
  // A never-saved dish's uploaded image would otherwise be orphaned in R2 —
  // already-saved dishes are cleaned up server-side on Save instead (see
  // syncSuggestedDishes in product.service.ts), same convention as removeImage
  // for product images.
  if (dish.imageUrl && !dish.id) deleteUploadedImage(dish.imageUrl)
  dishes.value.splice(idx, 1)
}

function moveUp(idx: number) {
  if (idx <= 0) return
  const arr = dishes.value
  const tmp = arr[idx - 1]!
  arr[idx - 1] = arr[idx]!
  arr[idx] = tmp
}

function moveDown(idx: number) {
  const arr = dishes.value
  if (idx >= arr.length - 1) return
  const tmp = arr[idx + 1]!
  arr[idx + 1] = arr[idx]!
  arr[idx] = tmp
}

function videoTypeLabel(videoUrl: string): string {
  if (!videoUrl) return 'Không có video'
  const type = detectVideoType(videoUrl)
  if (type === 'YOUTUBE') return 'YouTube'
  if (type === 'MP4') return 'Video MP4'
  return 'Video'
}
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="font-semibold text-highlighted">
        Gợi ý món ngon
      </h2>
    </template>

    <div class="space-y-3">
      <div v-if="!dishes.length" class="py-6 text-center text-sm text-muted">
        Chưa có món gợi ý nào
      </div>
      <div
        v-for="(dish, idx) in dishes"
        :key="dish.id ?? `new-${idx}`"
        class="flex items-center gap-3 rounded-lg border border-default p-3"
      >
        <div class="size-16 shrink-0 overflow-hidden rounded-md bg-elevated">
          <img v-if="dish.imageUrl" :src="dish.imageUrl" alt="" class="size-full object-cover">
          <div v-else class="flex size-full items-center justify-center">
            <UIcon name="i-lucide-image-off" class="size-5 text-muted" />
          </div>
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate font-medium text-highlighted">
            {{ dish.name }}
          </p>
          <p class="flex items-center gap-1 text-sm text-muted">
            <UIcon v-if="dish.videoUrl" name="i-lucide-play-circle" class="size-4" />
            {{ videoTypeLabel(dish.videoUrl) }}
          </p>
        </div>
        <div class="flex shrink-0 items-center gap-1">
          <UButton icon="i-lucide-chevron-up" size="sm" variant="ghost" :disabled="idx === 0" @click="moveUp(idx)" />
          <UButton icon="i-lucide-chevron-down" size="sm" variant="ghost" :disabled="idx === dishes.length - 1" @click="moveDown(idx)" />
          <UButton icon="i-lucide-pencil" size="sm" variant="ghost" @click="openEdit(idx)" />
          <UButton icon="i-lucide-trash-2" size="sm" variant="ghost" color="error" @click="removeDish(idx)" />
        </div>
      </div>

      <UButton icon="i-lucide-plus" variant="outline" @click="openCreate">
        Thêm món gợi ý
      </UButton>
    </div>

    <UModal v-model:open="modalOpen" :title="editingIndex !== null ? 'Sửa món gợi ý' : 'Thêm món gợi ý'">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Tên món" required>
            <UInput v-model="form.name" class="w-full" />
          </UFormField>
          <UFormField label="Ảnh món">
            <div
              class="rounded-lg border-2 border-dashed p-3 transition-colors"
              :class="isDraggingOver ? 'border-primary bg-primary/5' : 'border-transparent'"
              @dragenter.prevent="onDragEnter"
              @dragover.prevent
              @dragleave.prevent="onDragLeave"
              @drop.prevent="onDrop"
            >
              <div class="flex items-center gap-3">
                <div v-if="form.imageUrl" class="relative size-20 shrink-0 overflow-hidden rounded-md border border-default bg-elevated">
                  <img :src="form.imageUrl" alt="" class="size-full object-cover">
                  <UButton icon="i-lucide-x" size="xs" color="error" class="absolute right-1 top-1" @click="removeImage" />
                </div>
                <div class="flex flex-col items-start gap-1">
                  <label class="cursor-pointer">
                    <UButton :loading="uploading" icon="i-lucide-upload" size="sm" variant="outline" as="span">
                      Tải ảnh lên
                    </UButton>
                    <input type="file" accept="image/*" class="hidden" @change="onFileSelected">
                  </label>
                  <p class="text-xs text-muted">
                    hoặc kéo thả ảnh vào đây
                  </p>
                </div>
              </div>
            </div>
          </UFormField>
          <UFormField label="Video" hint="Không bắt buộc — dán link YouTube hoặc URL video MP4">
            <UInput v-model="form.videoUrl" placeholder="https://www.youtube.com/watch?v=..." class="w-full" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="outline" @click="modalOpen = false">
            Huỷ
          </UButton>
          <UButton @click="saveDish">
            Lưu
          </UButton>
        </div>
      </template>
    </UModal>
  </UCard>
</template>
