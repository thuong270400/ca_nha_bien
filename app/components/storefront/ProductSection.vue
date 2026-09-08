<script setup lang="ts">
import type { Product } from '#shared/types/catalog'

defineProps<{
  title: string
  description?: string
  products: Product[]
  viewAllTo?: string
}>()
</script>

<template>
  <section v-if="products.length" class="py-8">
    <UContainer>
      <div class="mb-4 flex items-end justify-between">
        <div>
          <h2 class="text-xl font-bold text-highlighted">
            {{ title }}
          </h2>
          <p v-if="description" class="text-sm text-muted">
            {{ description }}
          </p>
        </div>
        <UButton v-if="viewAllTo" :to="viewAllTo" variant="link" trailing-icon="i-lucide-arrow-right">
          Xem tất cả
        </UButton>
      </div>
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StorefrontProductCard v-for="product in products" :key="product.id" :product="product" />
      </div>
    </UContainer>
  </section>
</template>
