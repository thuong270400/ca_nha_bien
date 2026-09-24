<script setup lang="ts">
import type { Post } from '#shared/types/content'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const router = useRouter()
const toast = useToast()
const loading = ref(false)
const formRef = useTemplateRef('formRef')

async function onSubmit(payload: Record<string, unknown>) {
  loading.value = true
  try {
    const post = await $fetch<Post>('/api/admin/posts', { method: 'POST', body: payload })
    toast.add({ title: 'Đã tạo bài viết', color: 'success' })
    formRef.value?.markClean()
    router.push(`/admin/posts/${post.id}`)
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể tạo bài viết'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    loading.value = false
  }
}

useSeoMeta({ title: 'Thêm bài viết - Cá Nhà Biển Admin' })
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <div class="flex items-center gap-2">
      <UButton to="/admin/posts" icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="sm" />
      <h1 class="text-xl font-bold text-highlighted">
        Thêm bài viết
      </h1>
    </div>
    <AdminPostForm ref="formRef" :loading="loading" @submit="onSubmit" />
  </div>
</template>
