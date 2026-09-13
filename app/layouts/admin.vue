<script setup lang="ts">
const { user, clear } = useUserSession()
const router = useRouter()

const links = [
  { label: 'Tổng quan', icon: 'i-lucide-layout-dashboard', to: '/admin' },
  { label: 'Sản phẩm', icon: 'i-lucide-fish', to: '/admin/products' },
  { label: 'Danh mục', icon: 'i-lucide-tags', to: '/admin/categories' },
  { label: 'Tag', icon: 'i-lucide-tag', to: '/admin/tags' },
  { label: 'Đơn hàng', icon: 'i-lucide-shopping-bag', to: '/admin/orders' },
  { label: 'Khách hàng', icon: 'i-lucide-users', to: '/admin/customers' },
  { label: 'Đánh giá', icon: 'i-lucide-star', to: '/admin/reviews' },
  { label: 'Mã giảm giá', icon: 'i-lucide-ticket-percent', to: '/admin/coupons' },
  { label: 'Banner', icon: 'i-lucide-image', to: '/admin/banners' },
  { label: 'Mạng xã hội', icon: 'i-lucide-share-2', to: '/admin/social-links' },
  { label: 'Bài viết', icon: 'i-lucide-newspaper', to: '/admin/posts' },
  { label: 'Liên hệ', icon: 'i-lucide-inbox', to: '/admin/contacts' },
  { label: 'Báo cáo', icon: 'i-lucide-bar-chart-3', to: '/admin/reports' },
]

async function logout() {
  await clear()
  router.push('/')
}
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar>
      <template #header>
        <NuxtLink to="/admin" class="flex items-center gap-2 font-bold text-highlighted">
          <img src="/images/logo/logo.png" alt="Cá Nhà Biển" class="size-8 object-contain">
          Cá Nhà Biển Admin
        </NuxtLink>
      </template>

      <UNavigationMenu :items="links" orientation="vertical" />

      <template #footer>
        <UButton
          block
          color="neutral"
          variant="ghost"
          icon="i-lucide-log-out"
          :label="user?.name ?? 'Đăng xuất'"
          @click="logout"
        />
      </template>
    </UDashboardSidebar>

    <UDashboardPanel>
      <template #header>
        <UDashboardNavbar title="Quản trị">
          <template #right>
            <UButton
              to="/"
              target="_blank"
              variant="outline"
              color="neutral"
              icon="i-lucide-external-link"
              size="sm"
            >
              Xem cửa hàng
            </UButton>
          </template>
        </UDashboardNavbar>
      </template>
      <template #body>
        <slot />
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
