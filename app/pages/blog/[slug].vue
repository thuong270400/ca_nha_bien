<script setup lang="ts">
import type { Post } from '#shared/types/content'

const route = useRoute()
const slug = route.params.slug as string

const { data: post } = await useFetch<Post>(`/api/posts/slug/${slug}`, {
  key: `post-${slug}`,
})

if (!post.value || post.value.type !== 'NEWS') {
  throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy bài viết', fatal: true })
}

// Posts filed under a (visible) Góc Biển category are browsed from there, so the trail follows it.
const breadcrumb = computed(() => {
  const category = post.value?.category
  const middle = category?.isActive
    ? [{ label: 'Góc Biển', to: '/goc-bien' }, { label: category.name, to: `/goc-bien/${category.slug}` }]
    : [{ label: 'Tin tức', to: '/blog' }]
  return [{ label: 'Trang chủ', to: '/' }, ...middle, { label: post.value?.title ?? '' }]
})

const formattedDate = computed(() =>
  post.value?.publishedAt ? new Date(post.value.publishedAt).toLocaleDateString('vi-VN') : '',
)

useSeoMeta({
  title: () => `${post.value?.title} - Cá Nhà Biển`,
  description: () => post.value?.excerpt || undefined,
  ogTitle: () => post.value?.title,
  ogImage: () => post.value?.coverImageUrl ?? undefined,
})

useCanonical(`/blog/${slug}`)
</script>

<template>
  <UContainer v-if="post" class="py-8">
    <UBreadcrumb
      class="mb-6"
      :items="breadcrumb"
    />

    <article class="mx-auto max-w-3xl">
      <h1 class="text-2xl font-bold text-highlighted sm:text-3xl">
        {{ post.title }}
      </h1>
      <p v-if="formattedDate" class="mt-2 text-sm text-muted">
        {{ formattedDate }}
      </p>

      <div v-if="post.coverImageUrl" class="mt-6 aspect-video overflow-hidden rounded-xl bg-elevated">
        <img :src="post.coverImageUrl" :alt="post.title" class="size-full object-cover">
      </div>

      <StorefrontPostContent :content="post.content" class="mt-6" />
    </article>
  </UContainer>
</template>
