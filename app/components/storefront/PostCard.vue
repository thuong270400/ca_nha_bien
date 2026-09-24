<script setup lang="ts">
import type { PostListItem } from '#shared/types/content'

const props = defineProps<{
  post: PostListItem
  to: string
  /** Show the post's category name above the title (e.g. on Góc Biển search results that mix categories). */
  showCategory?: boolean
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
        loading="lazy"
        class="size-full object-cover transition group-hover:scale-105"
      >
    </div>
    <div class="p-4">
      <div class="flex flex-wrap items-center gap-x-2 text-xs text-muted">
        <span v-if="showCategory && post.category" class="font-semibold text-primary">{{ post.category.name }}</span>
        <span v-if="showCategory && post.category && formattedDate" aria-hidden="true">·</span>
        <span v-if="formattedDate">{{ formattedDate }}</span>
      </div>
      <h3 class="mt-1 line-clamp-2 font-semibold text-highlighted">
        {{ post.title }}
      </h3>
      <p v-if="post.excerpt" class="mt-1 line-clamp-2 text-sm text-muted">
        {{ post.excerpt }}
      </p>
    </div>
  </NuxtLink>
</template>
