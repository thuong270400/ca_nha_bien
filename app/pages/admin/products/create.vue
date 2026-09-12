<script setup lang="ts">
import type { Category, Tag } from '#shared/types/catalog'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { data: categories } = await useFetch<Category[]>('/api/categories', { key: 'admin-categories' })
const { data: tags } = await useFetch<Tag[]>('/api/tags', { key: 'admin-tags-form' })

const router = useRouter()
const toast = useToast()
const loading = ref(false)

async function onSubmit(payload: Record<string, unknown>) {
  loading.value = true
  try {
    const product = await $fetch('/api/products', { method: 'POST', body: payload })
    toast.add({ title: 'Đã tạo sản phẩm', color: 'success' })
    router.push(`/admin/products/${product.id}`)
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể tạo sản phẩm'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    loading.value = false
  }
}

useSeoMeta({ title: 'Thêm sản phẩm - Cá Nhà Biển Admin' })
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <h1 class="text-xl font-bold text-highlighted">
      Thêm sản phẩm
    </h1>
    <AdminProductForm
      :categories="categories ?? []"
      :tags="tags ?? []"
      :loading="loading"
      @submit="onSubmit"
      @cancel="router.push('/admin/products')"
    />
  </div>
</template>
