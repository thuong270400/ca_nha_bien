<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const router = useRouter()
const toast = useToast()
const loading = ref(false)

async function onSubmit(payload: Record<string, unknown>) {
  loading.value = true
  try {
    const post = await $fetch('/api/admin/posts', { method: 'POST', body: payload })
    toast.add({ title: 'Đã tạo bài viết', color: 'success' })
    router.push(`/admin/posts/${post.id}`)
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể tạo bài viết'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    loading.value = false
  }
}

useSeoMeta({ title: 'Thêm bài viết - Cá nhà biển Admin' })
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <h1 class="text-xl font-bold text-highlighted">
      Thêm bài viết
    </h1>
    <AdminPostForm :loading="loading" @submit="onSubmit" />
  </div>
</template>
