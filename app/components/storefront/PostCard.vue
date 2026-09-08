<script setup lang="ts">
import type { Post } from '#shared/types/content'

const props = defineProps<{
  post: Post
  to: string
}>()

const formattedDate = computed(() =>
  props.post.publishedAt ? new Date(props.post.publishedAt).toLocaleDateString('vi-VN') : '',
)
</script>

<template>
  <NuxtLink :to="to" class="group block overflow-hidden rounded-xl border border-default transition hover:shadow-md">
    <div class="aspect-video overflow-hidden bg-elevated">
      <img
        :src="post.coverImageUrl ?? '/images/placeholder-fish.svg'"
        :alt="post.title"
        class="size-full object-cover transition group-hover:scale-105"
      >
    </div>
    <div class="p-4">
      <p v-if="formattedDate" class="text-xs text-muted">
        {{ formattedDate }}
      </p>
      <h3 class="mt-1 line-clamp-2 font-semibold text-highlighted">
        {{ post.title }}
      </h3>
      <p v-if="post.excerpt" class="mt-1 line-clamp-2 text-sm text-muted">
        {{ post.excerpt }}
      </p>
    </div>
  </NuxtLink>
</template>
