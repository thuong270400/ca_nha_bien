<script setup lang="ts">
import type { PaginatedResult } from '#shared/types/catalog'
import type { Post } from '#shared/types/content'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const toast = useToast()

const typeOptions = [
  { label: 'Tất cả', value: '' },
  { label: 'Tin tức', value: 'NEWS' },
  { label: 'Tư vấn món ngon', value: 'RECIPE' },
]

const query = computed(() => ({
  type: (route.query.type as string) || undefined,
  page: route.query.page ? Number(route.query.page) : 1,
  limit: 20,
}))

const { data, refresh } = await useFetch<PaginatedResult<Post>>('/api/admin/posts', {
  key: 'admin-posts',
  query,
})

function setType(type: string | number | undefined) {
  router.push({ path: '/admin/posts', query: { type: type || undefined } })
}

function setPage(page: number) {
  router.push({ path: '/admin/posts', query: { ...route.query, page } })
}

const deletingId = ref<string | null>(null)
async function deletePost(id: string) {
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
      </h1>
      <UButton to="/admin/posts/create" icon="i-lucide-plus">
        Thêm bài viết
      </UButton>
    </div>

    <USelect
      :model-value="(route.query.type as string) || ''"
      :items="typeOptions"
      class="w-full max-w-xs"
      @update:model-value="setType"
    />

    <div class="overflow-x-auto rounded-xl border border-default">
      <table class="w-full text-sm">
        <thead class="bg-elevated text-left text-xs uppercase text-muted">
          <tr>
            <th class="px-4 py-3">
              Tiêu đề
            </th>
            <th class="px-4 py-3">
              Loại
            </th>
            <th class="px-4 py-3">
              Trạng thái
            </th>
            <th class="px-4 py-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr v-for="post in data?.data ?? []" :key="post.id">
            <td class="px-4 py-3 font-medium text-highlighted">
              {{ post.title }}
            </td>
            <td class="px-4 py-3 text-muted">
              {{ post.type === 'NEWS' ? 'Tin tức' : 'Tư vấn món ngon' }}
            </td>
            <td class="px-4 py-3">
              <UBadge :color="post.isPublished ? 'success' : 'neutral'">
                {{ post.isPublished ? 'Đã đăng' : 'Nháp' }}
              </UBadge>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex justify-end gap-2">
                <UButton :to="`/admin/posts/${post.id}`" icon="i-lucide-pencil" size="sm" variant="ghost" />
                <UButton
                  icon="i-lucide-trash-2"
                  size="sm"
                  variant="ghost"
                  color="error"
                  :loading="deletingId === post.id"
                  @click="deletePost(post.id)"
                />
              </div>
            </td>
          </tr>
          <tr v-if="!data?.data.length">
            <td colspan="4" class="px-4 py-10 text-center text-muted">
              Chưa có bài viết nào
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
