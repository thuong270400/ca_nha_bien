<script setup lang="ts">
import type { PaginatedResult } from '#shared/types/catalog'
import type { PostListItem } from '#shared/types/content'

const route = useRoute()
const router = useRouter()

const listQuery = computed(() => ({
  type: 'RECIPE' as const,
  page: route.query.page ? Number(route.query.page) : 1,
  limit: 12,
}))

const { data, status } = await useFetch<PaginatedResult<PostListItem>>('/api/posts', {
  query: listQuery,
  key: 'recipe-posts',
})

function setPage(page: number) {
  router.push({ path: '/recipes', query: { page } })
}

useSeoMeta({
  title: 'Tư vấn món ngon - Cá Nhà Biển',
  description: 'Công thức chế biến, mẹo nấu ăn ngon với cá và hải sản tươi tại Cá Nhà Biển.',
})

useCanonical('/recipes')
</script>

<template>
  <UContainer class="py-8">
    <UBreadcrumb class="mb-6" :items="[{ label: 'Trang chủ', to: '/' }, { label: 'Tư vấn món ngon' }]" />

    <h1 class="mb-6 text-2xl font-bold text-highlighted">
      Tư vấn món ngon
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
      <StorefrontPostCard v-for="post in data.data" :key="post.id" :post="post" :to="`/recipes/${post.slug}`" />
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
