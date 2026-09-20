<script setup lang="ts">
import type { Category, Product, SourcingClassification, Tag } from '#shared/types/catalog'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const id = route.params.id as string

const [{ data: categories }, { data: tags }, { data: sourcingClassifications }, { data: product }] = await Promise.all([
  useFetch<Category[]>('/api/categories', { key: 'admin-categories' }),
  useFetch<Tag[]>('/api/tags', { key: 'admin-tags-form' }),
  useFetch<SourcingClassification[]>('/api/sourcing-classifications', { key: 'admin-sourcing-classifications-form' }),
  useFetch<Product>(`/api/products/${id}`, { key: `admin-product-${id}` }),
])

if (!product.value) {
  throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy sản phẩm', fatal: true })
}

const toast = useToast()
const loading = ref(false)

async function onSubmit(payload: Record<string, unknown>) {
  loading.value = true
  try {
    await $fetch(`/api/products/${id}`, { method: 'PATCH', body: payload })
    toast.add({ title: 'Đã lưu thay đổi', color: 'success' })
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể lưu sản phẩm'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    loading.value = false
  }
}

useSeoMeta({ title: () => `Sửa: ${product.value?.name} - Cá Nhà Biển Admin` })
</script>

<template>
  <div v-if="product" class="space-y-4 p-4 sm:p-6">
    <h1 class="text-xl font-bold text-highlighted">
      Sửa sản phẩm
    </h1>
    <AdminProductForm
      :categories="categories ?? []"
      :tags="tags ?? []"
      :sourcing-classifications="sourcingClassifications ?? []"
      :initial="product"
      :loading="loading"
      @submit="onSubmit"
      @cancel="router.push('/admin/products')"
    />
  </div>
</template>
