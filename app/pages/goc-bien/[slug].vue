<script setup lang="ts">
import type { PaginatedResult } from '#shared/types/catalog'
import type { PostCategory, PostListItem } from '#shared/types/content'
import { postPublicPath } from '#shared/utils/post-content'

const route = useRoute()
const router = useRouter()
const slug = route.params.slug as string

const { data: category } = await useFetch<Omit<PostCategory, 'postCount'>>(`/api/post-categories/slug/${slug}`, {
  key: `post-category-${slug}`,
})

if (!category.value) {
  throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy danh mục bài viết', fatal: true })
}

const searchQuery = computed(() => (route.query.q as string | undefined)?.trim() || '')
const searchInput = ref(searchQuery.value)
watch(searchQuery, (q) => {
  searchInput.value = q
})

function submitSearch() {
  router.push({ path: `/goc-bien/${slug}`, query: { q: searchInput.value.trim() || undefined } })
}

function clearSearch() {
  searchInput.value = ''
  router.push({ path: `/goc-bien/${slug}` })
}

const listQuery = computed(() => ({
  category: slug,
  q: searchQuery.value || undefined,
  page: route.query.page ? Number(route.query.page) : 1,
  limit: 12,
}))

const { data: posts, status } = await useFetch<PaginatedResult<PostListItem>>('/api/posts', {
  query: listQuery,
  key: `post-category-posts-${slug}`,
})

function setPage(page: number) {
  router.push({ path: `/goc-bien/${slug}`, query: { ...route.query, page } })
}

useSeoMeta({
  title: () => `${category.value?.name} - Góc Biển - Cá Nhà Biển`,
  description: () => category.value?.description || `Bài viết thuộc chuyên mục ${category.value?.name} tại Góc Biển, Cá Nhà Biển.`,
  ogImage: () => category.value?.imageUrl ?? undefined,
})

useCanonical(`/goc-bien/${slug}`)
</script>

<template>
  <UContainer v-if="category" class="py-8">
    <UBreadcrumb
      class="mb-6"
      :items="[{ label: 'Trang chủ', to: '/' }, { label: 'Góc Biển', to: '/goc-bien' }, { label: category.name }]"
    />

    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-highlighted sm:text-3xl">
          {{ category.name }}
        </h1>
        <p v-if="category.description" class="mt-1 max-w-2xl text-muted">
          {{ category.description }}
        </p>
      </div>
      <form class="w-full sm:max-w-sm" role="search" @submit.prevent="submitSearch">
        <UInput
          v-model="searchInput"
          icon="i-lucide-search"
          :placeholder="`Tìm trong ${category.name}...`"
          class="w-full"
          :ui="{ trailing: 'pe-1' }"
        >
          <template v-if="searchInput" #trailing>
            <UButton color="neutral" variant="link" size="sm" icon="i-lucide-x" aria-label="Xoá tìm kiếm" @click="clearSearch" />
          </template>
        </UInput>
      </form>
    </div>

    <p v-if="searchQuery && posts" class="mb-4 text-sm text-muted">
      {{ posts.meta.total }} kết quả cho “{{ searchQuery }}”
    </p>

    <div v-if="status === 'pending'" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="i in 6" :key="i" class="aspect-video animate-pulse rounded-xl bg-elevated" />
    </div>

    <div v-else-if="!posts?.data.length" class="rounded-xl border border-dashed border-default py-16 text-center">
      <p class="text-muted">
        {{ searchQuery ? 'Không tìm thấy bài viết phù hợp.' : 'Danh mục này chưa có bài viết nào.' }}
      </p>
      <UButton to="/goc-bien" variant="link" class="mt-2">
        Xem các danh mục khác
      </UButton>
    </div>

    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StorefrontPostCard v-for="post in posts.data" :key="post.id" :post="post" :to="postPublicPath(post)" />
    </div>

    <div v-if="posts && posts.meta.totalPages > 1" class="mt-8 flex justify-center">
      <UPagination :page="posts.meta.page" :total="posts.meta.total" :items-per-page="posts.meta.limit" @update:page="setPage" />
    </div>
  </UContainer>
</template>
