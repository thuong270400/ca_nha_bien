<script setup lang="ts">
import type { SocialLink } from '#shared/types/content'
import { SOCIAL_ICON_PRESETS, SOCIAL_ICON_SIZES } from '#shared/types/content'

const year = new Date().getFullYear()
const { contact } = useAppConfig()

const { data: socialLinks } = await useFetch<SocialLink[]>('/api/social-links', { key: 'social-links' })
const footerLinks = computed(() => socialLinks.value?.filter(link => link.displayLocation === 'FOOTER') ?? [])

function iconFor(key: string | null) {
  return SOCIAL_ICON_PRESETS.find(preset => preset.key === key)?.icon ?? 'i-lucide-link'
}

function sizeOf(size: string) {
  return SOCIAL_ICON_SIZES.find(s => s.key === size) ?? SOCIAL_ICON_SIZES[1]
}
</script>

<template>
  <UFooter>
    <template #top>
      <UContainer>
        <div v-if="footerLinks.length" class="flex flex-wrap items-center justify-center gap-3 border-b border-default py-6">
          <a
            v-for="link in footerLinks"
            :key="link.id"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            class="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-elevated text-muted transition hover:bg-primary hover:text-inverted"
            :style="{ width: `${sizeOf(link.size).box}px`, height: `${sizeOf(link.size).box}px` }"
            :aria-label="link.label || 'Liên kết mạng xã hội'"
          >
            <img v-if="link.iconType === 'CUSTOM' && link.imageUrl" :src="link.imageUrl" :alt="link.label ?? ''" class="size-full object-cover">
            <UIcon v-else :name="iconFor(link.iconKey)" :style="{ width: `${sizeOf(link.size).icon}px`, height: `${sizeOf(link.size).icon}px` }" />
          </a>
        </div>

        <div class="grid grid-cols-1 gap-8 py-8 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <div class="flex items-center gap-2 text-lg font-bold text-primary">
              <img src="/images/logo/logo.png" alt="Cá Nhà Biển" class="size-8 object-contain">
              Cá Nhà Biển
            </div>
            <p class="mt-3 text-sm text-muted">
              Cá tươi mới tại ghe mỗi ngày – giao tận nơi.
            </p>
          </div>

          <div>
            <h3 class="mb-3 text-sm font-semibold text-highlighted">
              Thông tin
            </h3>
            <ul class="space-y-2 text-sm text-muted">
              <li><NuxtLink to="/about" class="hover:text-primary">Giới thiệu</NuxtLink></li>
              <li><NuxtLink to="/contact" class="hover:text-primary">Liên hệ</NuxtLink></li>
              <li><NuxtLink to="/policy#giao-hang" class="hover:text-primary">Chính sách giao hàng</NuxtLink></li>
              <li><NuxtLink to="/faq" class="hover:text-primary">Câu hỏi thường gặp</NuxtLink></li>
              <li><NuxtLink to="/blog" class="hover:text-primary">Tin tức</NuxtLink></li>
              <li><NuxtLink to="/recipes" class="hover:text-primary">Tư vấn món ngon</NuxtLink></li>
            </ul>
          </div>

          <div>
            <h3 class="mb-3 text-sm font-semibold text-highlighted">
              Cam kết
            </h3>
            <ul class="space-y-2 text-sm text-muted">
              <li class="flex items-center gap-2">
                <UIcon name="i-lucide-badge-check" class="size-4 text-primary" /> Cam kết cá tươi lấy tại ghe mỗi ngày.
              </li>
            </ul>
          </div>

          <div>
            <h3 class="mb-3 text-sm font-semibold text-highlighted">
              Khu vực giao hàng
            </h3>
            <p class="text-sm text-muted">
              Giao hàng tận nơi tại TP.HCM và các tỉnh thành lân cận qua đối tác vận chuyển.
            </p>
          </div>

          <div>
            <h3 class="mb-3 text-sm font-semibold text-highlighted">
              Liên hệ
            </h3>
            <ul class="space-y-2 text-sm text-muted">
              <li class="flex items-center gap-2">
                <UIcon name="i-lucide-phone" class="size-4" /> {{ contact.hotline }}
              </li>
              <li class="flex items-center gap-2">
                <UIcon name="i-lucide-mail" class="size-4" /> {{ contact.email }}
              </li>
              <li class="flex items-center gap-2">
                <UIcon name="i-lucide-map-pin" class="size-4" /> {{ contact.address }}
              </li>
            </ul>
          </div>
        </div>
      </UContainer>
    </template>

    <template #left>
      <p class="text-sm text-muted">
        © {{ year }} Cá Nhà Biển. All rights reserved.
      </p>
    </template>
  </UFooter>
</template>
