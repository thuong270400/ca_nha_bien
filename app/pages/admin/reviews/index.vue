<script setup lang="ts">
import type { AdminReviewView } from '#shared/types/review'

definePageMeta({ layout: 'admin', middleware: 'admin' })

interface ReviewList {
  data: AdminReviewView[]
  meta: { page: number, limit: number, total: number, totalPages: number }
}

const route = useRoute()
const router = useRouter()
const toast = useToast()

const query = computed(() => ({
  page: route.query.page ? Number(route.query.page) : 1,
  limit: 20,
}))

const { data, refresh } = await useFetch<ReviewList>('/api/admin/reviews', {
  key: 'admin-reviews',
  query,
})

function setPage(page: number) {
  router.push({ path: '/admin/reviews', query: { ...route.query, page } })
}

const togglingId = ref<string | null>(null)
async function toggleHidden(review: AdminReviewView) {
  togglingId.value = review.id
  try {
    await $fetch(`/api/admin/reviews/${review.id}`, { method: 'PATCH', body: { isHidden: !review.isHidden } })
    await refresh()
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể cập nhật đánh giá'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    togglingId.value = null
  }
}

const deletingId = ref<string | null>(null)
async function deleteReview(review: AdminReviewView) {
  deletingId.value = review.id
  try {
    await $fetch(`/api/admin/reviews/${review.id}`, { method: 'DELETE' })
    await refresh()
    toast.add({ title: 'Đã xoá đánh giá', color: 'success' })
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể xoá đánh giá'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    deletingId.value = null
  }
}

useSeoMeta({ title: 'Đánh giá - Cá nhà biển Admin' })
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <h1 class="text-xl font-bold text-highlighted">
      Đánh giá sản phẩm
    </h1>

    <div class="overflow-x-auto rounded-xl border border-default">
      <table class="w-full text-sm">
        <thead class="bg-elevated text-left text-xs uppercase text-muted">
          <tr>
            <th class="px-4 py-3">
              Sản phẩm
            </th>
            <th class="px-4 py-3">
              Khách hàng
            </th>
            <th class="px-4 py-3">
              Số sao
            </th>
            <th class="px-4 py-3">
              Bình luận
            </th>
            <th class="px-4 py-3">
              Trạng thái
            </th>
            <th class="px-4 py-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr v-for="review in data?.data ?? []" :key="review.id">
            <td class="px-4 py-3">
              <NuxtLink :to="`/products/${review.product.slug}`" target="_blank" class="font-medium text-highlighted hover:text-primary">
                {{ review.product.name }}
              </NuxtLink>
            </td>
            <td class="px-4 py-3 text-muted">
              {{ review.user.name }}
            </td>
            <td class="px-4 py-3">
              <span class="flex items-center gap-1">
                <UIcon name="i-lucide-star" class="size-4 text-warning" style="fill: currentColor" /> {{ review.rating }}
              </span>
            </td>
            <td class="max-w-xs truncate px-4 py-3 text-muted">
              {{ review.comment ?? '-' }}
            </td>
            <td class="px-4 py-3">
              <UBadge :color="review.isHidden ? 'neutral' : 'success'">
                {{ review.isHidden ? 'Đã ẩn' : 'Hiển thị' }}
              </UBadge>
            </td>
            <td class="px-4 py-3 text-right">
              <UButton
                size="sm"
                variant="ghost"
                color="neutral"
                :loading="togglingId === review.id"
                @click="toggleHidden(review)"
              >
                {{ review.isHidden ? 'Hiện' : 'Ẩn' }}
              </UButton>
              <UButton
                size="sm"
                variant="ghost"
                color="error"
                :loading="deletingId === review.id"
                @click="deleteReview(review)"
              >
                Xoá
              </UButton>
            </td>
          </tr>
          <tr v-if="!data?.data.length">
            <td colspan="6" class="px-4 py-10 text-center text-muted">
              Chưa có đánh giá nào
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
