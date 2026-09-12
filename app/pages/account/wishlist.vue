<script setup lang="ts">
import type { WishlistItemView } from '#shared/types/wishlist'

definePageMeta({ middleware: 'auth' })

const { data: items } = await useFetch<WishlistItemView[]>('/api/wishlist', { key: 'my-wishlist' })

useSeoMeta({ title: 'Sản phẩm yêu thích - Cá Nhà Biển' })
</script>

<template>
  <UContainer class="py-8">
    <h1 class="mb-6 text-2xl font-bold text-highlighted">
      Sản phẩm yêu thích
    </h1>
    <div class="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
      <AccountNav />

      <div>
        <div v-if="!items?.length" class="rounded-xl border border-dashed border-default py-16 text-center">
          <p class="text-muted">
            Bạn chưa có sản phẩm yêu thích nào.
          </p>
          <UButton to="/products" class="mt-4" variant="outline">
            Khám phá sản phẩm
          </UButton>
        </div>
        <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StorefrontProductCard v-for="item in items" :key="item.id" :product="item.product" />
        </div>
      </div>
    </div>
  </UContainer>
</template>
