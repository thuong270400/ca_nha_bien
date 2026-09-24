<script setup lang="ts">
import type { PaginatedResult } from '#shared/types/catalog'
import type { PostCategory, PostListItem } from '#shared/types/content'
import { postPublicPath } from '#shared/utils/post-content'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const toast = useToast()

const typeOptions = [
  { label: 'Tất cả loại', value: 'all' },
  { label: 'Tin tức', value: 'NEWS' },
  { label: 'Tư vấn món ngon', value: 'RECIPE' },
]

const statusOptions = [
  { label: 'Tất cả trạng thái', value: 'all' },
  { label: 'Đã đăng', value: 'true' },
  { label: 'Nháp', value: 'false' },
]

const { data: postCategories } = await useFetch<PostCategory[]>('/api/post-categories', { key: 'admin-post-categories' })
const categoryOptions = computed(() => [
  { label: 'Tất cả danh mục', value: 'all' },
  ...(postCategories.value ?? []).map(c => ({ label: c.name, value: c.id })),
])

const query = computed(() => ({
  type: (route.query.type as string) || undefined,
  categoryId: (route.query.categoryId as string) || undefined,
  isPublished: (route.query.isPublished as string) || undefined,
  q: (route.query.q as string) || undefined,
  page: route.query.page ? Number(route.query.page) : 1,
  limit: 20,
}))

const { data, refresh, status } = await useFetch<PaginatedResult<PostListItem>>('/api/admin/posts', {
  key: 'admin-posts',
  query,
})

function setFilter(key: 'type' | 'isPublished' | 'categoryId', value: string | number | undefined) {
  router.push({ path: '/admin/posts', query: { ...route.query, [key]: value && value !== 'all' ? value : undefined, page: undefined } })
}

const searchInput = ref((route.query.q as string) || '')
function submitSearch() {
  router.push({ path: '/admin/posts', query: { ...route.query, q: searchInput.value.trim() || undefined, page: undefined } })
}

function setPage(page: number) {
  router.push({ path: '/admin/posts', query: { ...route.query, page } })
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString('vi-VN') : '—'
}

const togglingId = ref<string | null>(null)
async function togglePublished(post: PostListItem) {
  togglingId.value = post.id
  try {
    await $fetch(`/api/admin/posts/${post.id}`, { method: 'PATCH', body: { isPublished: !post.isPublished } })
    toast.add({ title: post.isPublished ? 'Đã chuyển về nháp' : 'Đã đăng bài viết', color: 'success' })
    await refresh()
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể cập nhật bài viết'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    togglingId.value = null
  }
}

const confirm = useConfirm()
const deletingId = ref<string | null>(null)
async function deletePost(id: string, title: string) {
  const ok = await confirm({ title: `Xoá bài viết "${title}"?`, description: 'Bài viết và ảnh trong bài sẽ bị xoá vĩnh viễn.' })
  if (!ok) return
  deletingId.value = id
  try {
    await $fetch(`/api/admin/posts/${id}`, { method: 'DELETE' })
    toast.add({ title: 'Đã xoá bài viết', color: 'success' })
    await refresh()
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể xoá bài viết'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    deletingId.value = null
  }
}

useSeoMeta({ title: 'Bài viết - Cá Nhà Biển Admin' })
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-xl font-bold text-highlighted">
        Bài viết
        <span v-if="data" class="ml-1 text-sm font-normal text-muted">({{ data.meta.total }})</span>
      </h1>
      <UButton to="/admin/posts/create" icon="i-lucide-plus">
        Thêm bài viết
      </UButton>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <form class="min-w-56 max-w-sm flex-1" @submit.prevent="submitSearch">
        <UInput v-model="searchInput" icon="i-lucide-search" placeholder="Tìm theo tiêu đề hoặc slug..." class="w-full" />
      </form>
      <USelect
        :model-value="(route.query.type as string) || 'all'"
        :items="typeOptions"
        class="w-44"
        @update:model-value="setFilter('type', $event)"
      />
      <USelect
        :model-value="(route.query.isPublished as string) || 'all'"
        :items="statusOptions"
        class="w-44"
        @update:model-value="setFilter('isPublished', $event)"
      />
      <USelect
        :model-value="(route.query.categoryId as string) || 'all'"
        :items="categoryOptions"
        class="w-48"
        @update:model-value="setFilter('categoryId', $event)"
      />
    </div>

    <div class="overflow-x-auto rounded-xl border border-default">
      <table class="w-full text-sm">
        <thead class="bg-elevated text-left text-xs uppercase text-muted">
          <tr>
            <th class="px-4 py-3">
              Bài viết
            </th>
            <th class="px-4 py-3">
              Loại
            </th>
            <th class="px-4 py-3">
              Danh mục
            </th>
            <th class="px-4 py-3">
              Đăng
            </th>
            <th class="whitespace-nowrap px-4 py-3">
              Ngày đăng
            </th>
            <th class="whitespace-nowrap px-4 py-3">
              Cập nhật
            </th>
            <th class="px-4 py-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-default" :class="{ 'opacity-60': status === 'pending' }">
          <tr v-for="post in data?.data ?? []" :key="post.id">
            <td class="px-4 py-3">
              <NuxtLink :to="`/admin/posts/${post.id}`" class="flex min-w-64 items-center gap-3">
                <div class="h-12 w-20 shrink-0 overflow-hidden rounded-md border border-default bg-elevated">
                  <img v-if="post.coverImageUrl" :src="post.coverImageUrl" alt="" loading="lazy" class="size-full object-cover">
                  <div v-else class="flex size-full items-center justify-center text-dimmed">
                    <UIcon name="i-lucide-image" class="size-5" />
                  </div>
                </div>
                <div class="min-w-0">
                  <p class="line-clamp-2 font-medium text-highlighted hover:text-primary">
                    {{ post.title }}
                  </p>
                  <p class="truncate text-xs text-muted">
                    /{{ post.slug }}
                  </p>
                </div>
              </NuxtLink>
            </td>
            <td class="whitespace-nowrap px-4 py-3">
              <UBadge :color="post.type === 'NEWS' ? 'info' : 'secondary'" variant="subtle">
                {{ post.type === 'NEWS' ? 'Tin tức' : 'Tư vấn món ngon' }}
              </UBadge>
            </td>
            <td class="whitespace-nowrap px-4 py-3 text-muted">
              {{ post.category?.name ?? '—' }}
            </td>
            <td class="px-4 py-3">
              <USwitch
                :model-value="post.isPublished"
                :loading="togglingId === post.id"
                :disabled="togglingId === post.id"
                :aria-label="post.isPublished ? 'Chuyển về nháp' : 'Đăng bài'"
                @update:model-value="togglePublished(post)"
              />
            </td>
            <td class="whitespace-nowrap px-4 py-3 text-muted">
              {{ formatDate(post.publishedAt) }}
            </td>
            <td class="whitespace-nowrap px-4 py-3 text-muted">
              {{ formatDate(post.updatedAt) }}
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex justify-end gap-1">
                <UTooltip v-if="post.isPublished" text="Xem trên web">
                  <UButton
                    :to="postPublicPath(post)"
                    target="_blank"
                    icon="i-lucide-external-link"
                    size="sm"
                    color="neutral"
                    variant="ghost"
                  />
                </UTooltip>
                <UTooltip text="Sửa">
                  <UButton :to="`/admin/posts/${post.id}`" icon="i-lucide-pencil" size="sm" variant="ghost" />
                </UTooltip>
                <UTooltip text="Xoá">
                  <UButton
                    icon="i-lucide-trash-2"
                    size="sm"
                    variant="ghost"
                    color="error"
                    :loading="deletingId === post.id"
                    @click="deletePost(post.id, post.title)"
                  />
                </UTooltip>
              </div>
            </td>
          </tr>
          <tr v-if="!data?.data.length">
            <td colspan="7" class="px-4 py-10 text-center text-muted">
              {{ query.q || query.type || query.isPublished || query.categoryId ? 'Không có bài viết phù hợp bộ lọc' : 'Chưa có bài viết nào' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="data && data.meta.totalPages > 1" class="flex justify-center">
      <UPagination
        :page="data.meta.page"
        :total="data.meta.total"
        :items-per-page="data.meta.limit"
        @update:page="setPage"
      />
    </div>
  </div>
</template>
