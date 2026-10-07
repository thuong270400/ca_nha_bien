<script setup lang="ts">
export interface ImageRow {
  id?: string
  url: string
  alt: string
}

const props = defineProps<{
  /** Alt mặc định cho ảnh vừa tải lên (thường là tên sản phẩm/combo). */
  defaultAlt?: string
}>()

const images = defineModel<ImageRow[]>({ required: true })

const uploading = ref(false)
const toast = useToast()

async function uploadFiles(files: File[]) {
  const imageFiles = files.filter(f => f.type.startsWith('image/'))
  if (!imageFiles.length) return
  uploading.value = true
  try {
    for (const file of imageFiles) {
      const body = new FormData()
      body.append('file', file)
      const res = await $fetch<{ url: string }>('/api/admin/uploads', { method: 'POST', body })
      images.value.push({ url: res.url, alt: props.defaultAlt ?? '' })
    }
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Tải ảnh thất bại'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    uploading.value = false
  }
}

async function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const files = input.files ? Array.from(input.files) : []
  await uploadFiles(files)
  input.value = ''
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
  const files = e.dataTransfer?.files ? Array.from(e.dataTransfer.files) : []
  uploadFiles(files)
}

function removeImage(index: number) {
  const [image] = images.value.splice(index, 1)
  // Already-saved images (have an id) are cleaned up server-side on Save instead —
  // removing them here too would delete a still-live product image if the admin
  // navigates away without saving.
  if (image && !image.id) deleteUploadedImage(image.url)
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="font-semibold text-highlighted">
          Hình ảnh
        </h2>
        <label class="cursor-pointer">
          <UButton
            :loading="uploading"
            icon="i-lucide-upload"
            size="sm"
            variant="outline"
            as="span"
          >
            Tải ảnh lên
          </UButton>
          <input type="file" accept="image/*" multiple class="hidden" @change="onFileSelected">
        </label>
      </div>
    </template>
    <div
      class="rounded-lg border-2 border-dashed p-4 transition-colors"
      :class="isDraggingOver ? 'border-primary bg-primary/5' : 'border-transparent'"
      @dragenter.prevent="onDragEnter"
      @dragover.prevent
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
    >
      <div v-if="!images.length" class="py-6 text-center text-sm text-muted">
        Kéo thả ảnh vào đây, hoặc bấm "Tải ảnh lên"
      </div>
      <div v-else class="grid grid-cols-3 gap-3 sm:grid-cols-5">
        <div v-for="(image, idx) in images" :key="idx" class="group relative aspect-square overflow-hidden rounded-lg border border-default">
          <img :src="image.url" :alt="image.alt" class="size-full object-cover">
          <button
            type="button"
            class="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
            @click="removeImage(idx)"
          >
            <UIcon name="i-lucide-x" class="size-3" />
          </button>
        </div>
      </div>
    </div>
  </UCard>
</template>
