<script setup lang="ts">
import type { Post } from '#shared/types/content'

const props = defineProps<{
  initial?: Post
  loading?: boolean
}>()

const emit = defineEmits<{ submit: [payload: Record<string, unknown>] }>()

const form = reactive({
  title: props.initial?.title ?? '',
  slug: props.initial?.slug ?? '',
  type: props.initial?.type ?? 'NEWS',
  excerpt: props.initial?.excerpt ?? '',
  content: props.initial?.content ?? '',
  coverImageUrl: props.initial?.coverImageUrl ?? '',
  isPublished: props.initial?.isPublished ?? false,
})

const slugTouched = ref(Boolean(props.initial))
watch(() => form.title, (title) => {
  if (!slugTouched.value) form.slug = slugify(title)
})

const uploading = ref(false)
const toast = useToast()

async function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const body = new FormData()
    body.append('file', file)
    body.append('folder', 'posts')
    const res = await $fetch<{ url: string }>('/api/admin/uploads', { method: 'POST', body })
    // If the previous cover image was itself an unsaved upload from this same
    // session (not the persisted one), it's about to be orphaned — clean it up.
    if (form.coverImageUrl && form.coverImageUrl !== (props.initial?.coverImageUrl ?? '')) {
      deleteUploadedImage(form.coverImageUrl)
    }
    form.coverImageUrl = res.url
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Tải ảnh thất bại'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    uploading.value = false
    input.value = ''
  }
}

function submit() {
  emit('submit', {
    title: form.title,
    slug: form.slug,
    type: form.type,
    excerpt: form.excerpt || undefined,
    content: form.content,
    coverImageUrl: form.coverImageUrl || undefined,
    isPublished: form.isPublished,
  })
}
</script>

<template>
  <div class="space-y-6">
    <UCard>
      <template #header>
        <h2 class="font-semibold text-highlighted">
          Thông tin bài viết
        </h2>
      </template>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <UFormField label="Tiêu đề" required class="sm:col-span-2">
          <UInput v-model="form.title" class="w-full" />
        </UFormField>
        <UFormField label="Slug" required>
          <UInput v-model="form.slug" class="w-full" @input="slugTouched = true" />
        </UFormField>
        <UFormField label="Loại" required>
          <USelect
            v-model="form.type"
            :items="[{ label: 'Tin tức', value: 'NEWS' }, { label: 'Tư vấn món ngon', value: 'RECIPE' }]"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Mô tả ngắn" class="sm:col-span-2">
          <UTextarea v-model="form.excerpt" :rows="2" class="w-full" />
        </UFormField>
        <UFormField label="Ảnh bìa" class="sm:col-span-2">
          <div class="flex items-center gap-3">
            <div v-if="form.coverImageUrl" class="h-16 w-28 overflow-hidden rounded-md border border-default bg-elevated">
              <img :src="form.coverImageUrl" alt="" class="size-full object-cover">
            </div>
            <label class="cursor-pointer">
              <UButton :loading="uploading" icon="i-lucide-upload" size="sm" variant="outline" as="span">
                Tải ảnh lên
              </UButton>
              <input type="file" accept="image/*" class="hidden" @change="onFileSelected">
            </label>
          </div>
        </UFormField>
        <UFormField label="Nội dung" required class="sm:col-span-2">
          <UTextarea v-model="form.content" :rows="12" class="w-full" />
        </UFormField>
        <UCheckbox v-model="form.isPublished" label="Đăng bài (hiển thị công khai)" class="sm:col-span-2" />
      </div>
    </UCard>

    <div class="flex justify-end gap-3">
      <UButton to="/admin/posts" color="neutral" variant="outline">
        Huỷ
      </UButton>
      <UButton :loading="loading" @click="submit">
        Lưu bài viết
      </UButton>
    </div>
  </div>
</template>
