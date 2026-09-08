<script setup lang="ts">
import type { Category } from '#shared/types/catalog'

const { data: categories } = await useFetch<Category[]>('/api/categories', {
  query: { activeOnly: true },
  key: 'nav-categories',
})

const { loggedIn, user, clear } = useUserSession()
const cartStore = useCartStore()
const wishlistStore = useWishlistStore()
await Promise.all([cartStore.ensureLoaded(), wishlistStore.ensureLoaded()])

const router = useRouter()

const navItems = computed(() => [
  { label: 'Tất cả sản phẩm', to: '/products' },
  ...(categories.value ?? []).map((c: Category) => ({ label: c.name, to: `/categories/${c.slug}` })),
])

async function logout() {
  await clear()
  router.push('/')
}
</script>

<template>
  <div class="border-b border-default bg-elevated/60 text-xs text-muted">
    <UContainer class="flex h-9 items-center gap-4">
      <div class="min-w-0 flex-1 overflow-hidden">
        <div class="flex w-max animate-marquee whitespace-nowrap">
          <span class="pr-16">Cá tươi, hải sản tươi sống đánh bắt trong ngày — giao tận nhà mỗi sáng.</span>
          <span class="pr-16" aria-hidden="true">Cá tươi, hải sản tươi sống đánh bắt trong ngày — giao tận nhà mỗi sáng.</span>
        </div>
      </div>
      <a href="tel:19001234" class="flex shrink-0 items-center gap-1.5 font-medium text-primary hover:underline">
        <UIcon name="i-lucide-phone" class="size-3.5" />
        Hotline: 1900 1234
      </a>
    </UContainer>
  </div>

  <UHeader>
    <template #title>
      <NuxtLink to="/" class="flex items-center gap-2 text-lg font-bold text-primary">
        <img src="/images/logo/logo.png" alt="Cá nhà biển" class="size-8 object-contain">
        Cá nhà biển
      </NuxtLink>
    </template>

    <nav class="flex items-center gap-1">
      <UPopover mode="hover" :content="{ side: 'bottom', align: 'start', sideOffset: 10 }">
        <UButton
          color="neutral"
          variant="link"
          trailing-icon="i-lucide-chevron-down"
          label="Danh mục"
        />

        <template #content>
          <div class="grid w-[280px] grid-cols-1 gap-1 p-3 sm:w-[420px] sm:grid-cols-2">
            <NuxtLink
              v-for="category in categories ?? []"
              :key="category.id"
              :to="`/categories/${category.slug}`"
              class="flex items-center gap-3 rounded-lg p-2 transition hover:bg-elevated"
            >
              <div class="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-elevated">
                <img v-if="category.imageUrl" :src="category.imageUrl" :alt="category.name" class="size-full object-cover">
                <UIcon v-else name="i-lucide-fish" class="size-5 text-muted" />
              </div>
              <span class="text-sm font-medium text-highlighted">{{ category.name }}</span>
            </NuxtLink>
          </div>
        </template>
      </UPopover>

      <UButton to="/products" color="neutral" variant="link" label="Tất cả sản phẩm" />
    </nav>

    <template #right>
      <div class="hidden w-56 md:block">
        <StorefrontSearchBox />
      </div>

      <UChip
        :text="cartStore.itemCount"
        :show="cartStore.itemCount > 0"
        size="md"
        :ui="{ base: 'h-5 min-w-5 px-1 text-[11px] font-bold leading-none' }"
      >
        <UButton
          to="/cart"
          icon="i-lucide-shopping-cart"
          color="neutral"
          variant="ghost"
          aria-label="Giỏ hàng"
        />
      </UChip>

      <UDropdownMenu
        v-if="loggedIn"
        :items="[[
          { label: 'Tài khoản của tôi', icon: 'i-lucide-user', to: '/account' },
          { label: 'Đơn hàng của tôi', icon: 'i-lucide-package', to: '/account/orders' },
          { label: 'Đăng xuất', icon: 'i-lucide-log-out', onSelect: logout },
        ]]"
      >
        <UButton color="neutral" variant="ghost" icon="i-lucide-user-round" :label="user?.name" />
      </UDropdownMenu>
      <UButton
        v-else
        to="/login"
        icon="i-lucide-user"
        color="neutral"
        variant="ghost"
        aria-label="Đăng nhập"
      />
    </template>

    <template #body>
      <div class="mb-4">
        <StorefrontSearchBox size="md" />
      </div>
      <UNavigationMenu :items="navItems" orientation="vertical" />
    </template>
  </UHeader>
</template>

<style scoped>
@keyframes marquee {
  to {
    transform: translateX(-50%);
  }
}

.animate-marquee {
  animation: marquee 22s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .animate-marquee {
    animation: none;
  }
}
</style>
