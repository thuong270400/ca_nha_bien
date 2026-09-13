<script setup lang="ts">
import type { SocialLink } from '#shared/types/content'
import { SOCIAL_ICON_PRESETS, SOCIAL_ICON_SIZES } from '#shared/types/content'

const { data: socialLinks } = await useFetch<SocialLink[]>('/api/social-links', { key: 'social-links' })
const fixedLinks = computed(() => socialLinks.value?.filter(link => link.displayLocation === 'FIXED') ?? [])

function iconFor(key: string | null) {
  return SOCIAL_ICON_PRESETS.find(preset => preset.key === key)?.icon ?? 'i-lucide-link'
}

function sizeOf(size: string) {
  return SOCIAL_ICON_SIZES.find(s => s.key === size) ?? SOCIAL_ICON_SIZES[1]
}

const { y } = useWindowScroll()
const showScrollTop = computed(() => y.value > 400)

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="fixed bottom-6 right-4 z-50 flex flex-col items-center gap-3 sm:right-6">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0 translate-y-2"
    >
      <UButton
        v-if="showScrollTop"
        icon="i-lucide-arrow-up"
        color="neutral"
        variant="solid"
        size="lg"
        class="rounded-full shadow-lg"
        aria-label="Lên đầu trang"
        @click="scrollToTop"
      />
    </Transition>

    <a
      v-for="link in fixedLinks"
      :key="link.id"
      :href="link.url"
      target="_blank"
      rel="noopener noreferrer"
      class="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-inverted text-inverted shadow-lg transition-colors hover:bg-inverted/90"
      :style="{ width: `${sizeOf(link.size).box}px`, height: `${sizeOf(link.size).box}px` }"
      :aria-label="link.label || 'Liên kết mạng xã hội'"
    >
      <img v-if="link.iconType === 'CUSTOM' && link.imageUrl" :src="link.imageUrl" :alt="link.label ?? ''" class="size-full object-cover">
      <UIcon v-else :name="iconFor(link.iconKey)" :style="{ width: `${sizeOf(link.size).icon}px`, height: `${sizeOf(link.size).icon}px` }" />
    </a>
  </div>
</template>
