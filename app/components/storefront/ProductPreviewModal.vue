<script setup lang="ts">
import type { ProductDetail } from '#shared/types/catalog'

// Opened from ProductCard: shows the product detail content in a popup first;
// the "Xem chi tiết" button in the header navigates to /products/[slug].
const open = defineModel<boolean>('open', { default: false })
const { slug } = defineProps<{ slug: string }>()

const detail = ref<ProductDetail | null>(null)
const loading = ref(false)
const error = ref(false)

async function load() {
  if (detail.value?.slug === slug) return
  loading.value = true
  error.value = false
  try {
    detail.value = await $fetch<ProductDetail>(`/api/products/slug/${slug}`)
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

watch(open, (isOpen) => {
  if (isOpen) load()
})

const detailPath = computed(() => `/products/${slug}`)
</script>

<template>
  <UModal
    v-model:open="open"
    :title="detail?.name ?? 'Chi tiết sản phẩm'"
    :ui="{ content: 'sm:max-w-5xl', body: 'sm:p-6' }"
  >
    <template #header="{ close }">
      <div class="flex w-full items-center justify-between gap-3">
        <UButton
          :to="detailPath"
          icon="i-lucide-arrow-up-right"
          trailing
          variant="soft"
          size="sm"
          @click="open = false"
        >
          Xem chi tiết
        </UButton>
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          size="sm"
          aria-label="Đóng"
          @click="close"
        />
      </div>
    </template>

    <template #body>
      <div v-if="loading" class="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <USkeleton class="aspect-square w-full rounded-xl" />
        <div class="space-y-4">
          <USkeleton class="h-4 w-1/3" />
          <USkeleton class="h-8 w-2/3" />
          <USkeleton class="h-10 w-1/2" />
          <USkeleton class="h-12 w-full" />
        </div>
      </div>
      <div v-else-if="error" class="py-10 text-center text-sm text-muted">
        Không tải được thông tin sản phẩm.
        <UButton variant="link" @click="load">
          Thử lại
        </UButton>
      </div>
      <template v-else-if="detail">
        <StorefrontProductDetailMain :product="detail" heading-tag="h2" />
        <StorefrontSuggestedDishes :dishes="detail.suggestedDishes" />
      </template>
    </template>
  </UModal>
</template>
