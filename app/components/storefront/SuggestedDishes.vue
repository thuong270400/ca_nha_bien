<script setup lang="ts">
import type { SuggestedDish } from '#shared/types/catalog'
import { getYoutubeEmbedUrl } from '#shared/utils/video'

const { dishes } = defineProps<{ dishes: SuggestedDish[] }>()

const activeDish = ref<SuggestedDish | null>(null)

const modalOpen = computed({
  get: () => activeDish.value !== null,
  set: (value: boolean) => { if (!value) activeDish.value = null },
})

const embedUrl = computed(() => {
  const dish = activeDish.value
  if (!dish?.videoUrl || dish.videoType !== 'YOUTUBE') return null
  return getYoutubeEmbedUrl(dish.videoUrl)
})

function openVideo(dish: SuggestedDish) {
  if (!dish.videoUrl) return
  activeDish.value = dish
}
</script>

<template>
  <section v-if="dishes.length" class="py-8">
    <UContainer>
      <h2 class="mb-4 text-xl font-bold text-highlighted">
        Gợi ý món ngon
      </h2>
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <button
          v-for="dish in dishes"
          :key="dish.id"
          type="button"
          class="group text-left"
          :class="dish.videoUrl ? 'cursor-pointer' : 'cursor-default'"
          @click="openVideo(dish)"
        >
          <div class="relative aspect-square overflow-hidden rounded-xl bg-elevated">
            <img
              :src="dish.imageUrl ?? '/images/placeholder-fish.svg'"
              :alt="dish.name"
              class="size-full object-cover transition duration-300"
              :class="dish.videoUrl ? 'group-hover:scale-105' : ''"
            >
            <div
              v-if="dish.videoUrl"
              class="absolute inset-0 flex items-center justify-center bg-black/10 transition group-hover:bg-black/25"
            >
              <span class="flex size-12 items-center justify-center rounded-full bg-white/90 text-primary shadow-md">
                <UIcon name="i-lucide-play" class="size-6" />
              </span>
            </div>
          </div>
          <p class="mt-2 truncate text-sm font-medium text-highlighted">
            {{ dish.name }}
          </p>
        </button>
      </div>
    </UContainer>

    <UModal v-model:open="modalOpen" :title="activeDish?.name" :ui="{ content: 'max-w-2xl' }">
      <template #body>
        <div class="aspect-video overflow-hidden rounded-lg bg-black">
          <iframe
            v-if="embedUrl"
            :src="embedUrl"
            class="size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          />
          <video
            v-else-if="activeDish?.videoUrl"
            :src="activeDish.videoUrl"
            controls
            autoplay
            class="size-full"
          />
        </div>
      </template>
    </UModal>
  </section>
</template>
