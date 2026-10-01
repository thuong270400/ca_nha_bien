<script setup lang="ts">
import type { Product, ProductDetail } from '#shared/types/catalog'

const route = useRoute()
const slug = route.params.slug as string

const { data: product } = await useFetch<ProductDetail>(`/api/products/slug/${slug}`, {
  key: `product-${slug}`,
})

if (!product.value) {
  throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy sản phẩm', fatal: true })
}

const { user } = useUserSession()
const editOpen = ref(false)

const isAdmin = computed(() => user.value?.role === 'ADMIN')

function onProductUpdated(updated: Product) {
  if (!product.value) return
  // New object (not Object.assign) so ProductDetailMain's variants watcher
  // fires and resets the selected variant/image.
  product.value = { ...product.value, ...updated }
}

useSeoMeta({
  title: () => `${product.value?.name} - Cá Nhà Biển`,
  description: () => product.value?.description || `Mua ${product.value?.name} tươi ngon tại Cá Nhà Biển`,
  ogTitle: () => product.value?.name,
  ogDescription: () => product.value?.description || undefined,
  ogImage: () => product.value?.images[0]?.url,
})

useCanonical(`/products/${slug}`)

useHead(() => ({
  script: product.value
    ? [{
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Product',
          'name': product.value.name,
          'description': product.value.description ?? undefined,
          'image': product.value.images.map(i => i.url),
          'offers': product.value.variants.map(v => ({
            '@type': 'Offer',
            'price': v.price,
            'priceCurrency': 'VND',
            'availability': v.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          })),
        }),
      }]
    : [],
}))
</script>

<template>
  <UContainer v-if="product" class="py-8">
    <UBreadcrumb
      class="mb-6"
      :items="[
        { label: 'Trang chủ', to: '/' },
        ...(product.categories[0] ? [{ label: product.categories[0].name, to: `/categories/${product.categories[0].slug}` }] : []),
        { label: product.name },
      ]"
    />

    <StorefrontProductDetailMain :product="product" :editable="isAdmin" @edit="editOpen = true" />

    <StorefrontSuggestedDishes :dishes="product.suggestedDishes" />

    <StorefrontProductSection
      v-if="product.related.length"
      title="Sản phẩm liên quan"
      :products="product.related"
    />

    <StorefrontProductReviews
      :product-id="product.id"
      :product-key="`product-${slug}`"
      :avg-rating="product.avgRating"
      :review-count="product.reviewCount"
    />

    <StorefrontProductEditDialog
      v-if="isAdmin"
      v-model:open="editOpen"
      :product="product"
      @updated="onProductUpdated"
    />
  </UContainer>
</template>
