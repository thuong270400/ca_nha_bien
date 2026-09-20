<script setup lang="ts">
import type { Category, Product, SourcingClassification, Tag } from '#shared/types/catalog'

const open = defineModel<boolean>('open', { default: false })
const { product } = defineProps<{ product: Product }>()
const emit = defineEmits<{ updated: [product: Product] }>()

const { data: categories } = await useFetch<Category[]>('/api/categories', { key: 'admin-categories' })
const { data: tags } = await useFetch<Tag[]>('/api/tags', { key: 'admin-tags-form' })
const { data: sourcingClassifications } = await useFetch<SourcingClassification[]>('/api/sourcing-classifications', { key: 'admin-sourcing-classifications-form' })

const toast = useToast()
const loading = ref(false)

async function onSubmit(payload: Record<string, unknown>) {
  loading.value = true
  try {
    const updated = await $fetch<Product>(`/api/products/${product.id}`, { method: 'PATCH', body: payload })
    toast.add({ title: 'Đã lưu thay đổi', color: 'success' })
    emit('updated', updated)
    open.value = false
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể lưu sản phẩm'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Chỉnh sửa sản phẩm" :ui="{ content: 'max-w-3xl' }">
    <template #body>
      <AdminProductForm
        v-if="open"
        :categories="categories ?? []"
        :tags="tags ?? []"
        :sourcing-classifications="sourcingClassifications ?? []"
        :initial="product"
        :loading="loading"
        @submit="onSubmit"
        @cancel="open = false"
      />
    </template>
  </UModal>
</template>
