<script setup lang="ts">
import type { Post } from '#shared/types/content'
import { postPublicPath } from '#shared/utils/post-content'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const id = route.params.id as string

const { data: post } = await useFetch<Post>(`/api/admin/posts/${id}`, { key: `admin-post-${id}` })

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy bài viết', fatal: true })
}

const toast = useToast()
const loading = ref(false)
const formRef = useTemplateRef('formRef')

async function onSubmit(payload: Record<string, unknown>) {
  loading.value = true
  try {
    post.value = await $fetch<Post>(`/api/admin/posts/${id}`, { method: 'PATCH', body: payload })
    formRef.value?.markClean()
    toast.add({ title: 'Đã lưu thay đổi', color: 'success' })
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể lưu bài viết'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    loading.value = false
  }
}

const updatedAtLabel = computed(() =>
  post.value ? new Date(post.value.updatedAt).toLocaleString('vi-VN') : '',
)

useSeoMeta({ title: () => `Sửa: ${post.value?.title} - Cá Nhà Biển Admin` })
</script>

<template>
  <div v-if="post" class="space-y-4 p-4 sm:p-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <UButton to="/admin/posts" icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="sm" />
        <div>
          <h1 class="text-xl font-bold text-highlighted">
            Sửa bài viết
          </h1>
          <p class="text-xs text-muted">
            Cập nhật lần cuối: {{ updatedAtLabel }}
          </p>
        </div>
      </div>
      <UButton
        v-if="post.isPublished"
        :to="postPublicPath(post)"
        target="_blank"
        icon="i-lucide-external-link"
        color="neutral"
        variant="outline"
        size="sm"
      >
        Xem trên web
      </UButton>
    </div>
    <AdminPostForm ref="formRef" :initial="post" :loading="loading" @submit="onSubmit" />
  </div>
</template>
