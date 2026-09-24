<script setup lang="ts">
import type { PaginatedResult } from '#shared/types/catalog'
import type { PostListItem } from '#shared/types/content'

const route = useRoute()
const router = useRouter()

const listQuery = computed(() => ({
  type: 'NEWS' as const,
  page: route.query.page ? Number(route.query.page) : 1,
  limit: 12,
}))

const { data, status } = await useFetch<PaginatedResult<PostListItem>>('/api/posts', {
  query: listQuery,
  key: 'blog-posts',
})

function setPage(page: number) {
  router.push({ path: '/blog', query: { page } })
}

useSeoMeta({
  title: 'Tin tức - Cá Nhà Biển',
  description: 'Tin tức, kiến thức về cá và hải sản tươi sống tại Cá Nhà Biển.',
})

useCanonical('/blog')
</script>

<template>
  <UContainer class="py-8">
    <UBreadcrumb class="mb-6" :items="[{ label: 'Trang chủ', to: '/' }, { label: 'Tin tức' }]" />

    <h1 class="mb-6 text-2xl font-bold text-highlighted">
      Tin tức
    </h1>

    <div v-if="status === 'pending'" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="i in 6" :key="i" class="aspect-video animate-pulse rounded-xl bg-elevated" />
    </div>

    <div v-else-if="!data?.data.length" class="rounded-xl border border-dashed border-default py-16 text-center">
      <p class="text-muted">
        Chưa có bài viết nào.
      </p>
    </div>

    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StorefrontPostCard v-for="post in data.data" :key="post.id" :post="post" :to="`/blog/${post.slug}`" />
    </div>

    <div v-if="data && data.meta.totalPages > 1" class="mt-8 flex justify-center">
      <UPagination
        :page="data.meta.page"
        :total="data.meta.total"
        :items-per-page="data.meta.limit"
        @update:page="setPage"
      />
    </div>
  </UContainer>
</template>
