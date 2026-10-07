<script setup lang="ts">
import type { Category, Product, Tag } from '#shared/types/catalog'

const open = defineModel<boolean>('open', { default: false })
const { product } = defineProps<{ product: Product }>()
const emit = defineEmits<{ updated: [product: Product] }>()

const { data: categories } = await useFetch<Category[]>('/api/categories', { key: 'admin-categories' })
const { data: tags } = await useFetch<Tag[]>('/api/tags', { key: 'admin-tags-form' })

const title = computed(() => product.isCombo ? 'Chỉnh sửa combo' : 'Chỉnh sửa sản phẩm')

const toast = useToast()
const loading = ref(false)

async function onSubmit(payload: Record<string, unknown>) {
  loading.value = true
  try {
    // Combo có form/endpoint riêng (giá, tồn kho tự tính từ thành phần) — xem combo.service.ts.
    const endpoint = product.isCombo ? `/api/combos/${product.id}` : `/api/products/${product.id}`
    const updated = await $fetch<Product>(endpoint, { method: 'PATCH', body: payload })
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
  <UModal v-model:open="open" :title="title" :ui="{ content: 'max-w-4xl' }">
    <template #body>
      <template v-if="open">
        <AdminComboForm
          v-if="product.isCombo"
          :categories="categories ?? []"
          :initial="product"
          :loading="loading"
          @submit="onSubmit"
          @cancel="open = false"
        />
        <AdminProductForm
          v-else
          :categories="categories ?? []"
          :tags="tags ?? []"
          :initial="product"
          :loading="loading"
          @submit="onSubmit"
          @cancel="open = false"
        />
      </template>
    </template>
  </UModal>
</template>
