<script setup lang="ts">
import type { CategoryHomeSection } from '#shared/types/catalog'
import type { Banner } from '#shared/types/content'
import type { CouponPromoView } from '#shared/types/coupon'

interface HomeData {
  categorySections: CategoryHomeSection[]
  banners: Banner[]
  promotedCoupons: CouponPromoView[]
}

const { data } = await useFetch<HomeData>('/api/home', { key: 'home-data' })

useSeoMeta({
  title: 'Cá Nhà Biển - Cá tươi mỗi ngày',
  description: 'Cá tươi, hải sản tươi sống đánh bắt trong ngày, giao tận nhà. Đặt hàng online, thanh toán khi nhận hàng.',
  ogTitle: 'Cá Nhà Biển - Cá tươi mỗi ngày',
  ogDescription: 'Cá tươi, hải sản tươi sống đánh bắt trong ngày, giao tận nhà.',
})
useCanonical('/')
</script>

<template>
  <div>
    <section
      v-if="data?.banners.length"
      class="bg-[linear-gradient(rgba(0,0,0,0.35),rgba(0,0,0,0.35)),url('/images/background/bien_oi.png')] bg-cover bg-center bg-no-repeat"
    >
      <UCarousel
        v-slot="{ item }"
        :items="data.banners"
        :autoplay="{ delay: 12000, stopOnInteraction: false }"
        arrows
        dots
        loop
        class="mx-auto max-w-7xl"
      >
        <UContainer
          class="grid min-h-[90vh] items-center gap-8 py-12 lg:py-20"
          :class="item.imageUrl ? 'lg:grid-cols-[1fr_1.4fr]' : 'lg:grid-cols-1'"
        >
          <div
            class="rounded-2xl bg-white/10 p-6 shadow-lg backdrop-blur-[2px] dark:bg-black/10"
            :class="{ 'mx-auto max-w-2xl text-center': !item.imageUrl }"
          >
            <h1 v-if="item.title" class="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              {{ item.title }}
            </h1>
            <p v-if="item.subtitle" class="mt-4 max-w-md font-semibold text-white/80" :class="{ 'mx-auto': !item.imageUrl }">
              {{ item.subtitle }}
            </p>
            <div
              v-if="item.buttons.length"
              class="mt-6 flex flex-wrap gap-3"
              :class="{ 'justify-center': !item.imageUrl }"
            >
              <UButton
                v-for="(btn, idx) in item.buttons"
                :key="btn.id"
                :to="btn.link"
                :target="isExternalLink(btn.link) ? '_blank' : undefined"
                size="lg"
                class="text-white"
                :variant="idx === 0 ? 'solid' : 'outline'"
                :trailing-icon="isExternalLink(btn.link) ? 'i-lucide-external-link' : (idx === 0 ? 'i-lucide-arrow-right' : undefined)"
              >
                {{ btn.label }}
              </UButton>
            </div>
          </div>
          <div v-if="item.imageUrl" class="relative flex aspect-[16/9] items-center justify-center overflow-hidden rounded-2xl">
            <img
              :src="item.imageUrl"
              :alt="item.title ?? 'Cá Nhà Biển'"
              class="size-full object-contain object-center"
            >
          </div>
        </UContainer>
      </UCarousel>
    </section>

    <section v-else class="bg-gradient-to-br from-sky-50 to-white dark:from-ocean-950 dark:to-gray-950">
      <UContainer class="grid min-h-[90vh] items-center gap-8 py-12 lg:grid-cols-[1fr_1.4fr] lg:py-20">
        <div>
          <UBadge color="primary" variant="subtle" class="mb-4">
            Đánh bắt trong ngày
          </UBadge>
          <h1 class="text-3xl font-bold leading-tight text-highlighted sm:text-4xl lg:text-5xl">
            Cá tươi mỗi ngày,<br>giao tận nhà
          </h1>
          <p class="mt-4 max-w-md text-muted">
            Cá Nhà Biển chọn lọc cá và hải sản tươi sống từ ngư dân, sơ chế sạch trước khi giao đến tận nhà bạn.
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
        <div class="relative flex aspect-[16/9] items-center justify-center overflow-hidden rounded-2xl">
          <img
            src="/images/placeholder-fish.svg"
            alt="Cá tươi Cá Nhà Biển"
            class="size-full object-contain object-center"
          >
        </div>
      </UContainer>
    </section>

    <StorefrontCouponTicketRow :coupons="data?.promotedCoupons ?? []" />

    <StorefrontProductSection
      v-for="section in data?.categorySections ?? []"
      :key="section.id"
      :title="section.name"
      :description="section.description ?? undefined"
      :image-url="section.imageUrl ?? undefined"
      :products="section.products"
      :view-all-to="section.hasMore ? `/categories/${section.slug}` : undefined"
    />

    <div class="py-4">
      <UContainer>
        <div class="mx-auto h-0.5 w-full max-w-2xl bg-gradient-to-r from-transparent via-primary to-transparent" />
      </UContainer>
    </div>

    <section class="bg-elevated py-12">
      <UContainer>
        <div class="mx-auto max-w-xs text-center">
          <UIcon name="i-lucide-badge-check" class="mx-auto size-10 text-primary" />
          <h3 class="mt-3 font-semibold text-highlighted">
            Cam kết tươi 100%
          </h3>
          <p class="mt-1 text-sm text-muted">
            Lấy cá tươi mới tại ghe mỗi ngày và giao tận nơi cho quý khách.
          </p>
        </div>
      </UContainer>
    </section>

    <div class="py-4">
      <UContainer>
        <div class="mx-auto h-0.5 w-full max-w-2xl bg-gradient-to-r from-transparent via-primary to-transparent" />
      </UContainer>
    </div>
  </div>
</template>
