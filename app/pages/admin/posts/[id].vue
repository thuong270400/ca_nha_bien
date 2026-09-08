<script setup lang="ts">
import type { Post } from '#shared/types/content'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const id = route.params.id as string

const { data: post } = await useFetch<Post>(`/api/admin/posts/${id}`, { key: `admin-post-${id}` })

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy bài viết', fatal: true })
}

const toast = useToast()
const loading = ref(false)

async function onSubmit(payload: Record<string, unknown>) {
  loading.value = true
  try {
    await $fetch(`/api/admin/posts/${id}`, { method: 'PATCH', body: payload })
    toast.add({ title: 'Đã lưu thay đổi', color: 'success' })
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể lưu bài viết'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    loading.value = false
  }
}

useSeoMeta({ title: () => `Sửa: ${post.value?.title} - Cá nhà biển Admin` })
</script>

<template>
  <div v-if="post" class="space-y-4 p-4 sm:p-6">
    <h1 class="text-xl font-bold text-highlighted">
      Sửa bài viết
    </h1>
    <AdminPostForm :initial="post" :loading="loading" @submit="onSubmit" />
  </div>
</template>
