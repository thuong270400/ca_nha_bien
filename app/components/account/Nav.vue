<script setup lang="ts">
const route = useRoute()

const links = [
  { label: 'Thông tin cá nhân', to: '/account', icon: 'i-lucide-user' },
  { label: 'Đơn hàng của tôi', to: '/account/orders', icon: 'i-lucide-package' },
  { label: 'Sổ địa chỉ', to: '/account/addresses', icon: 'i-lucide-map-pin' },
  { label: 'Yêu thích', to: '/account/wishlist', icon: 'i-lucide-heart' },
]
</script>

<template>
  <nav class="space-y-1">
    <NuxtLink
      v-for="link in links"
      :key="link.to"
      :to="link.to"
      class="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition"
      :class="route.path === link.to ? 'bg-primary/10 font-medium text-primary' : 'text-muted hover:bg-elevated'"
    >
      <UIcon :name="link.icon" class="size-4" />
      {{ link.label }}
    </NuxtLink>
  </nav>
</template>
