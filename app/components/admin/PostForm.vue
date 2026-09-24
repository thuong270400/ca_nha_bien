<script setup lang="ts">
import type { EditorCustomHandlers, EditorToolbarItem } from '@nuxt/ui'
import type { Post, PostCategory } from '#shared/types/content'
import { extractUploadImageUrls, postPlainText, toPostHtml } from '#shared/utils/post-content'

const props = defineProps<{
  initial?: Post
  loading?: boolean
}>()

const emit = defineEmits<{ submit: [payload: Record<string, unknown>] }>()

const EXCERPT_MAX = 500

function initialState() {
  return {
    title: props.initial?.title ?? '',
    slug: props.initial?.slug ?? '',
    type: props.initial?.type ?? 'NEWS',
    // USelect can't hold an empty-string value, so 'none' stands for "no category"
    categoryId: props.initial?.categoryId ?? 'none',
    excerpt: props.initial?.excerpt ?? '',
    // legacy posts hold plain text — convert once so the editor opens them as paragraphs
    content: props.initial ? toPostHtml(props.initial.content) : '',
    coverImageUrl: props.initial?.coverImageUrl ?? '',
    isPublished: props.initial?.isPublished ?? false,
  }
}

const form = reactive(initialState())

const slugTouched = ref(Boolean(props.initial))
watch(() => form.title, (title) => {
  if (!slugTouched.value) form.slug = slugify(title)
})

const toast = useToast()

const { data: postCategories } = await useFetch<PostCategory[]>('/api/post-categories', { key: 'admin-post-categories' })
const categoryOptions = computed(() => [
  { label: 'Không có danh mục', value: 'none' },
  ...(postCategories.value ?? []).map(c => ({ label: c.isActive ? c.name : `${c.name} (đang ẩn)`, value: c.id })),
])

function errorMessage(err: unknown, fallback: string) {
  return (err as { data?: { message?: string } })?.data?.message ?? fallback
}

async function uploadImage(file: File) {
  const body = new FormData()
  body.append('file', file)
  body.append('folder', 'posts')
  const res = await $fetch<{ url: string }>('/api/admin/uploads', { method: 'POST', body })
  sessionUploads.add(res.url)
  return res.url
}

/**
 * Images uploaded while this form is open but not saved yet. Anything in here that
 * ends up unreferenced (replaced cover, image deleted from the editor, form cancelled)
 * is deleted from storage; persisted images are cleaned up server-side by post.service.ts.
 */
const sessionUploads = new Set<string>()

function cleanupSessionUploads(keep: string[]) {
  const keepSet = new Set(keep)
  for (const url of sessionUploads) {
    if (keepSet.has(url)) continue
    deleteUploadedImage(url)
    sessionUploads.delete(url)
  }
}

// ---- Cover image ----
const uploadingCover = ref(false)

async function onCoverSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploadingCover.value = true
  try {
    form.coverImageUrl = await uploadImage(file)
  } catch (err) {
    toast.add({ title: 'Lỗi', description: errorMessage(err, 'Tải ảnh thất bại'), color: 'error' })
  } finally {
    uploadingCover.value = false
    input.value = ''
  }
}

// ---- Content editor ----
const editorRef = useTemplateRef('editorRef')
const contentImageInput = useTemplateRef('contentImageInput')
const uploadingContentImage = ref(false)

async function onContentImageSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploadingContentImage.value = true
  try {
    const src = await uploadImage(file)
    editorRef.value?.editor?.chain().focus().setImage({ src, alt: form.title }).run()
  } catch (err) {
    toast.add({ title: 'Lỗi', description: errorMessage(err, 'Tải ảnh thất bại'), color: 'error' })
  } finally {
    uploadingContentImage.value = false
    input.value = ''
  }
}

// Same as UEditor's default link handler, with a Vietnamese prompt.
const editorHandlers: EditorCustomHandlers = {
  link: {
    canExecute: editor => editor.can().setLink({ href: '' }) || editor.can().unsetLink(),
    execute: (editor) => {
      const chain = editor.chain().focus()
      if (editor.getAttributes('link').href) return chain.extendMarkRange('link').unsetLink()
      const href = window.prompt('Nhập đường dẫn (URL):', 'https://')?.trim()
      if (!href || href === 'https://') return chain
      return chain.extendMarkRange('link').setLink({ href })
    },
    isActive: editor => editor.isActive('link'),
    isDisabled: editor => editor.isActive('image'),
  },
}

const toolbarItems = computed<EditorToolbarItem[][]>(() => [
  [
    { kind: 'undo', icon: 'i-lucide-undo', tooltip: { text: 'Hoàn tác' } },
    { kind: 'redo', icon: 'i-lucide-redo', tooltip: { text: 'Làm lại' } },
  ],
  [
    {
      icon: 'i-lucide-heading',
      tooltip: { text: 'Kiểu đoạn' },
      content: { align: 'start' },
      items: [
        { kind: 'paragraph', label: 'Đoạn văn', icon: 'i-lucide-pilcrow' },
        { kind: 'heading', level: 2, label: 'Tiêu đề lớn', icon: 'i-lucide-heading-2' },
        { kind: 'heading', level: 3, label: 'Tiêu đề vừa', icon: 'i-lucide-heading-3' },
        { kind: 'heading', level: 4, label: 'Tiêu đề nhỏ', icon: 'i-lucide-heading-4' },
      ],
    },
  ],
  [
    { kind: 'mark', mark: 'bold', icon: 'i-lucide-bold', tooltip: { text: 'In đậm' } },
    { kind: 'mark', mark: 'italic', icon: 'i-lucide-italic', tooltip: { text: 'In nghiêng' } },
    { kind: 'mark', mark: 'underline', icon: 'i-lucide-underline', tooltip: { text: 'Gạch chân' } },
    { kind: 'mark', mark: 'strike', icon: 'i-lucide-strikethrough', tooltip: { text: 'Gạch ngang' } },
  ],
  [
    { kind: 'bulletList', icon: 'i-lucide-list', tooltip: { text: 'Danh sách' } },
    { kind: 'orderedList', icon: 'i-lucide-list-ordered', tooltip: { text: 'Danh sách đánh số' } },
    { kind: 'blockquote', icon: 'i-lucide-text-quote', tooltip: { text: 'Trích dẫn' } },
    { kind: 'horizontalRule', icon: 'i-lucide-separator-horizontal', tooltip: { text: 'Đường kẻ ngang' } },
  ],
  [
    { kind: 'link', icon: 'i-lucide-link', tooltip: { text: 'Chèn / bỏ liên kết' } },
    {
      icon: 'i-lucide-image-plus',
      tooltip: { text: 'Chèn ảnh' },
      loading: uploadingContentImage.value,
      onClick: () => contentImageInput.value?.click(),
    },
  ],
  [
    { kind: 'clearFormatting', icon: 'i-lucide-remove-formatting', tooltip: { text: 'Xoá định dạng' } },
  ],
])

// ---- Dirty tracking / leave guard ----
const savedSnapshot = ref(JSON.stringify(form))
const isDirty = computed(() => JSON.stringify(form) !== savedSnapshot.value)

/** Called by the parent page after a successful save, before navigating away. */
function markClean() {
  savedSnapshot.value = JSON.stringify(form)
  // now persisted — from here on post.service.ts owns their cleanup, not this form
  for (const url of [form.coverImageUrl, ...extractUploadImageUrls(form.content)]) sessionUploads.delete(url)
}
defineExpose({ markClean })

onBeforeRouteLeave(() => {
  if (isDirty.value && !window.confirm('Bài viết có thay đổi chưa lưu. Rời trang?')) return false
  cleanupSessionUploads(isDirty.value ? [] : [form.coverImageUrl, ...extractUploadImageUrls(form.content)])
})

useEventListener('beforeunload', (e: BeforeUnloadEvent) => {
  if (isDirty.value) e.preventDefault()
})

// ---- Submit ----
function submit() {
  if (!form.title.trim()) {
    toast.add({ title: 'Vui lòng nhập tiêu đề', color: 'error' })
    return
  }
  if (!postPlainText(form.content) && !/<img\b/i.test(form.content)) {
    toast.add({ title: 'Vui lòng nhập nội dung bài viết', color: 'error' })
    return
  }
  // uploads the admin already removed from the editor/cover won't be saved — drop them now
  cleanupSessionUploads([form.coverImageUrl, ...extractUploadImageUrls(form.content)])
  emit('submit', {
    title: form.title,
    slug: form.slug,
    type: form.type,
    categoryId: form.categoryId === 'none' ? null : form.categoryId,
    excerpt: form.excerpt.trim() || null,
    content: form.content,
    coverImageUrl: form.coverImageUrl || null,
    isPublished: form.isPublished,
  })
}
</script>

<template>
  <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
    <div class="space-y-6 lg:col-span-2">
      <UCard>
        <div class="space-y-4">
          <UFormField label="Tiêu đề" required>
            <UInput v-model="form.title" size="lg" placeholder="Nhập tiêu đề bài viết" class="w-full" />
          </UFormField>
          <UFormField label="Slug" required help="Đường dẫn của bài viết, tự tạo từ tiêu đề">
            <UInput v-model="form.slug" class="w-full" @input="slugTouched = true" />
          </UFormField>
          <UFormField label="Mô tả ngắn" :help="`${form.excerpt.length}/${EXCERPT_MAX} ký tự — hiển thị trên thẻ bài viết và mô tả SEO`">
            <UTextarea v-model="form.excerpt" :rows="3" :maxlength="EXCERPT_MAX" autoresize class="w-full" />
          </UFormField>
        </div>
      </UCard>

      <UCard :ui="{ body: 'p-0 sm:p-0' }">
        <template #header>
          <h2 class="font-semibold text-highlighted">
            Nội dung <span class="text-error">*</span>
          </h2>
        </template>
        <UEditor
          ref="editorRef"
          v-slot="{ editor }"
          v-model="form.content"
          content-type="html"
          :handlers="editorHandlers"
          placeholder="Viết nội dung bài viết..."
          :ui="{ base: 'min-h-96 px-4 py-5 sm:px-6 [&_img]:rounded-lg [&_img]:max-w-full' }"
        >
          <UEditorToolbar
            :editor="editor"
            :items="toolbarItems"
            class="sticky top-0 z-10 overflow-x-auto border-b border-default bg-default px-2 py-1.5"
          />
        </UEditor>
        <input ref="contentImageInput" type="file" accept="image/*" class="hidden" @change="onContentImageSelected">
      </UCard>
    </div>

    <div class="space-y-6">
      <UCard>
        <template #header>
          <h2 class="font-semibold text-highlighted">
            Xuất bản
          </h2>
        </template>
        <div class="space-y-4">
          <USwitch
            v-model="form.isPublished"
            label="Đăng bài"
            :description="form.isPublished ? 'Bài viết hiển thị công khai' : 'Đang là bản nháp, khách không thấy'"
          />
          <UFormField label="Loại" required>
            <USelect
              v-model="form.type"
              :items="[{ label: 'Tin tức', value: 'NEWS' }, { label: 'Tư vấn món ngon', value: 'RECIPE' }]"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Danh mục" help="Bài viết hiển thị trong danh mục này ở mục Góc Biển">
            <USelect v-model="form.categoryId" :items="categoryOptions" class="w-full" />
          </UFormField>
          <p class="-mt-2 text-xs">
            <NuxtLink to="/admin/categories?tab=posts" class="text-primary hover:underline">
              Quản lý danh mục bài viết
            </NuxtLink>
          </p>
          <div class="flex gap-3">
            <UButton to="/admin/posts" color="neutral" variant="outline" class="flex-1 justify-center">
              Huỷ
            </UButton>
            <UButton :loading="loading" class="flex-1 justify-center" @click="submit">
              Lưu bài viết
            </UButton>
          </div>
          <p v-if="isDirty" class="text-xs text-warning">
            Có thay đổi chưa lưu
          </p>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="font-semibold text-highlighted">
            Ảnh bìa
          </h2>
        </template>
        <div class="space-y-3">
          <div class="aspect-video overflow-hidden rounded-lg border border-default bg-elevated">
            <img v-if="form.coverImageUrl" :src="form.coverImageUrl" alt="" class="size-full object-cover">
            <div v-else class="flex size-full items-center justify-center text-muted">
              <UIcon name="i-lucide-image" class="size-8" />
            </div>
          </div>
          <div class="flex gap-2">
            <label class="cursor-pointer">
              <UButton :loading="uploadingCover" icon="i-lucide-upload" size="sm" variant="outline" as="span">
                {{ form.coverImageUrl ? 'Đổi ảnh' : 'Tải ảnh lên' }}
              </UButton>
              <input type="file" accept="image/*" class="hidden" @change="onCoverSelected">
            </label>
            <UButton
              v-if="form.coverImageUrl"
              icon="i-lucide-trash-2"
              size="sm"
              color="error"
              variant="ghost"
              @click="form.coverImageUrl = ''"
            >
              Gỡ ảnh
            </UButton>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
