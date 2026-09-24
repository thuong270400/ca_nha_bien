<script setup lang="ts">
import type { PaginatedResult } from '#shared/types/catalog'
import type { PostCategory, PostListItem } from '#shared/types/content'
import { postPublicPath } from '#shared/utils/post-content'

const route = useRoute()
const router = useRouter()

const searchQuery = computed(() => (route.query.q as string | undefined)?.trim() || '')
const searchInput = ref(searchQuery.value)
watch(searchQuery, (q) => {
  searchInput.value = q
})

function submitSearch() {
  router.push({ path: '/goc-bien', query: { q: searchInput.value.trim() || undefined } })
}

function clearSearch() {
  searchInput.value = ''
  router.push({ path: '/goc-bien' })
}

const { data: categories } = await useFetch<PostCategory[]>('/api/post-categories', {
  query: { activeOnly: true },
  key: 'goc-bien-categories',
})

// Search results when ?q= is set, otherwise the latest posts across every category.
const postsQuery = computed(() => ({
  q: searchQuery.value || undefined,
  page: route.query.page ? Number(route.query.page) : 1,
  limit: searchQuery.value ? 12 : 6,
}))

const { data: posts, status } = await useFetch<PaginatedResult<PostListItem>>('/api/posts', {
  query: postsQuery,
  key: 'goc-bien-posts',
})

function setPage(page: number) {
  router.push({ path: '/goc-bien', query: { ...route.query, page } })
}

useSeoMeta({
  title: 'Góc Biển - Cá Nhà Biển',
  description: 'Góc Biển — tin tức, kiến thức và món ngon từ cá, hải sản tươi sống tại Cá Nhà Biển.',
})

useCanonical('/goc-bien')
</script>

<template>
  <UContainer class="py-8">
    <UBreadcrumb class="mb-6" :items="[{ label: 'Trang chủ', to: '/' }, { label: 'Góc Biển' }]" />

    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-highlighted sm:text-3xl">
          Góc Biển
        </h1>
        <p class="mt-1 text-muted">
          Tin tức, kiến thức và bí quyết chế biến hải sản.
        </p>
      </div>
      <form class="w-full sm:max-w-sm" role="search" @submit.prevent="submitSearch">
        <UInput
          v-model="searchInput"
          icon="i-lucide-search"
          placeholder="Tìm bài viết..."
          size="lg"
          class="w-full"
          :ui="{ trailing: 'pe-1' }"
        >
          <template v-if="searchInput" #trailing>
            <UButton color="neutral" variant="link" size="sm" icon="i-lucide-x" aria-label="Xoá tìm kiếm" @click="clearSearch" />
          </template>
        </UInput>
      </form>
    </div>

    <!-- Search results -->
    <section v-if="searchQuery">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 class="text-lg font-semibold text-highlighted">
          Kết quả cho “{{ searchQuery }}”
          <span v-if="posts" class="text-sm font-normal text-muted">({{ posts.meta.total }} bài viết)</span>
        </h2>
        <UButton color="neutral" variant="link" icon="i-lucide-arrow-left" @click="clearSearch">
          Xem danh mục
        </UButton>
      </div>

      <div v-if="status === 'pending'" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="i in 6" :key="i" class="aspect-video animate-pulse rounded-xl bg-elevated" />
      </div>
      <div v-else-if="!posts?.data.length" class="rounded-xl border border-dashed border-default py-16 text-center">
        <p class="text-muted">
          Không tìm thấy bài viết phù hợp.
        </p>
      </div>
      <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StorefrontPostCard v-for="post in posts.data" :key="post.id" :post="post" :to="postPublicPath(post)" show-category />
      </div>

      <div v-if="posts && posts.meta.totalPages > 1" class="mt-8 flex justify-center">
        <UPagination :page="posts.meta.page" :total="posts.meta.total" :items-per-page="posts.meta.limit" @update:page="setPage" />
      </div>
    </section>

    <template v-else>
      <!-- Categories -->
      <section>
        <h2 class="mb-4 text-lg font-semibold text-highlighted">
          Danh mục bài viết
        </h2>
        <div v-if="!categories?.length" class="rounded-xl border border-dashed border-default py-16 text-center">
          <p class="text-muted">
            Chưa có danh mục bài viết nào.
          </p>
        </div>
        <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NuxtLink
            v-for="category in categories"
            :key="category.id"
            :to="`/goc-bien/${category.slug}`"
            class="group flex overflow-hidden rounded-xl border border-default transition hover:border-primary hover:shadow-md"
          >
            <div class="flex w-28 shrink-0 items-center justify-center overflow-hidden bg-elevated sm:w-32">
              <img
                v-if="category.imageUrl"
                :src="category.imageUrl"
                :alt="category.name"
                loading="lazy"
                class="size-full object-cover transition group-hover:scale-105"
              >
              <UIcon v-else name="i-lucide-waves" class="size-10 text-primary/60" />
            </div>
            <div class="flex min-w-0 flex-1 flex-col justify-center gap-1 p-4">
              <h3 class="font-semibold text-highlighted group-hover:text-primary">
                {{ category.name }}
              </h3>
              <p v-if="category.description" class="line-clamp-2 text-sm text-muted">
                {{ category.description }}
              </p>
              <p class="text-xs text-muted">
                {{ category.postCount }} bài viết
              </p>
            </div>
          </NuxtLink>
        </div>
      </section>

      <!-- Latest posts -->
      <section v-if="posts?.data.length" class="mt-12">
        <h2 class="mb-4 text-lg font-semibold text-highlighted">
          Bài viết mới nhất
        </h2>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StorefrontPostCard v-for="post in posts.data" :key="post.id" :post="post" :to="postPublicPath(post)" show-category />
        </div>
      </section>
    </template>
  </UContainer>
</template>
