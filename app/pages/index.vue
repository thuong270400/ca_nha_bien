<script setup lang="ts">
import type { Category, Product } from '#shared/types/catalog'
import type { Banner } from '#shared/types/content'

interface HomeData {
  bestSelling: Product[]
  newArrivals: Product[]
  onSale: Product[]
  categories: Category[]
  banners: Banner[]
}

const { data } = await useFetch<HomeData>('/api/home', { key: 'home-data' })

useSeoMeta({
  title: 'Cá nhà biển - Cá tươi mỗi ngày',
  description: 'Cá tươi, hải sản tươi sống đánh bắt trong ngày, giao tận nhà. Đặt hàng online, thanh toán khi nhận hàng.',
  ogTitle: 'Cá nhà biển - Cá tươi mỗi ngày',
  ogDescription: 'Cá tươi, hải sản tươi sống đánh bắt trong ngày, giao tận nhà.',
})
useCanonical('/')
</script>

<template>
  <div>
    <section v-if="data?.banners.length" class="bg-gradient-to-br from-sky-50 to-white dark:from-ocean-950 dark:to-gray-950">
      <UCarousel
        v-slot="{ item }"
        :items="data.banners"
        arrows
        dots
        loop
        class="mx-auto max-w-7xl"
      >
        <UContainer class="grid items-center gap-8 py-12 lg:grid-cols-2 lg:py-20">
          <div>
            <h1 v-if="item.title" class="text-3xl font-bold leading-tight text-highlighted sm:text-4xl lg:text-5xl">
              {{ item.title }}
            </h1>
            <p v-if="item.subtitle" class="mt-4 max-w-md text-muted">
              {{ item.subtitle }}
            </p>
            <div v-if="item.ctaLabel && item.ctaLink" class="mt-6 flex gap-3">
              <UButton :to="item.ctaLink" size="lg" trailing-icon="i-lucide-arrow-right">
                {{ item.ctaLabel }}
              </UButton>
            </div>
          </div>
          <div class="relative">
            <img
              :src="item.imageUrl"
              :alt="item.title ?? 'Cá nhà biển'"
              class="mx-auto w-full max-w-md rounded-2xl"
            >
          </div>
        </UContainer>
      </UCarousel>
    </section>

    <section v-else class="bg-gradient-to-br from-sky-50 to-white dark:from-ocean-950 dark:to-gray-950">
      <UContainer class="grid items-center gap-8 py-12 lg:grid-cols-2 lg:py-20">
        <div>
          <UBadge color="primary" variant="subtle" class="mb-4">
            Đánh bắt trong ngày
          </UBadge>
          <h1 class="text-3xl font-bold leading-tight text-highlighted sm:text-4xl lg:text-5xl">
            Cá tươi mỗi ngày,<br>giao tận nhà
          </h1>
          <p class="mt-4 max-w-md text-muted">
            Cá nhà biển chọn lọc cá và hải sản tươi sống từ ngư dân, sơ chế sạch trước khi giao đến tận nhà bạn.
          </p>
          <div class="mt-6 flex gap-3">
            <UButton to="/products" size="lg" trailing-icon="i-lucide-arrow-right">
              Mua ngay
            </UButton>
            <UButton to="/products" size="lg" variant="outline" color="neutral">
              Xem thực đơn cá
            </UButton>
          </div>
        </div>
        <div class="relative">
          <img
            src="/images/placeholder-fish.svg"
            alt="Cá tươi Cá nhà biển"
            class="mx-auto w-full max-w-md rounded-2xl"
          >
        </div>
      </UContainer>
    </section>

    <section class="py-8">
      <UContainer>
        <h2 class="mb-4 text-xl font-bold text-highlighted">
          Danh mục
        </h2>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <NuxtLink
            v-for="category in data?.categories ?? []"
            :key="category.id"
            :to="`/products?category=${category.slug}`"
            class="flex flex-col items-center gap-2 rounded-xl border border-default p-4 text-center transition hover:shadow-md"
          >
            <img
              :src="category.imageUrl ?? '/images/placeholder-fish.svg'"
              :alt="category.name"
              class="size-16 rounded-full object-cover"
            >
            <span class="text-sm font-medium text-highlighted">{{ category.name }}</span>
          </NuxtLink>
        </div>
      </UContainer>
    </section>

    <StorefrontProductSection
      title="Cá bán chạy"
      description="Được khách hàng lựa chọn nhiều nhất"
      :products="data?.bestSelling ?? []"
      view-all-to="/products?sort=best_selling"
    />

    <StorefrontProductSection
      title="Cá mới về"
      description="Vừa cập bến, tươi ngon nhất"
      :products="data?.newArrivals ?? []"
      view-all-to="/products?sort=newest"
    />

    <StorefrontProductSection
      title="Đang giảm giá"
      description="Ưu đãi có thời hạn"
      :products="data?.onSale ?? []"
      view-all-to="/products"
    />

    <section class="bg-elevated py-12">
      <UContainer>
        <div class="mx-auto max-w-xs text-center">
          <UIcon name="i-lucide-badge-check" class="mx-auto size-10 text-primary" />
          <h3 class="mt-3 font-semibold text-highlighted">
            Cam kết tươi 100%
          </h3>
          <p class="mt-1 text-sm text-muted">
            Đánh bắt và giao trong ngày, không qua đông lạnh lâu ngày.
          </p>
        </div>
      </UContainer>
    </section>
  </div>
</template>
