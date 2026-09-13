<script setup lang="ts">
import type { Product } from '#shared/types/catalog'

defineProps<{
  title: string
  description?: string
  imageUrl?: string
  products: Product[]
  viewAllTo?: string
}>()
</script>

<template>
  <section v-if="products.length" class="py-8">
    <UContainer>
      <div class="overflow-hidden rounded-xl">
        <div class="flex items-end justify-between gap-3 bg-ocean-700 px-4 py-4 sm:px-6 dark:bg-ocean-800">
          <div class="flex items-center gap-3">
            <img v-if="imageUrl" :src="imageUrl" :alt="title" class="size-9 shrink-0 rounded-full object-cover ring-1 ring-white/40">
            <div>
              <h2 class="text-xl font-bold text-white">
                {{ title }}
              </h2>
              <p v-if="description" class="text-sm text-white/80">
                {{ description }}
              </p>
            </div>
          </div>
          <UButton v-if="viewAllTo" :to="viewAllTo" variant="link" trailing-icon="i-lucide-arrow-right" class="text-white/90 hover:text-white">
            Xem tất cả
          </UButton>
        </div>
        <div class="grid grid-cols-2 gap-4 bg-elevated p-4 sm:grid-cols-3 sm:p-6 lg:grid-cols-5">
          <StorefrontProductCard v-for="product in products" :key="product.id" :product="product" />
        </div>
      </div>
    </UContainer>
  </section>
</template>
