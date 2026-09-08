<script setup lang="ts">
import type { PaginatedResult } from '#shared/types/catalog'
import type { ReviewEligibility, ReviewView } from '#shared/types/review'

const { productId, productKey, avgRating, reviewCount } = defineProps<{
  productId: string
  productKey: string
  avgRating: number
  reviewCount: number
}>()

const { loggedIn } = useUserSession()
const toast = useToast()

const page = ref(1)
const { data: reviews, refresh: refreshReviews } = await useFetch<PaginatedResult<ReviewView>>('/api/reviews', {
  key: () => `reviews-${productId}-${page.value}`,
  query: computed(() => ({ productId, page: page.value, limit: 5 })),
})

const { data: eligibility, refresh: refreshEligibility } = await useFetch<ReviewEligibility>('/api/reviews/eligibility', {
  key: `review-eligibility-${productId}`,
  query: { productId },
  immediate: loggedIn.value,
})

const form = reactive({ rating: 0, comment: '' })
const hoverRating = ref(0)
const submitting = ref(false)

async function submitReview() {
  if (form.rating < 1) {
    toast.add({ title: 'Vui lòng chọn số sao', color: 'error' })
    return
  }
  submitting.value = true
  try {
    await $fetch('/api/reviews', {
      method: 'POST',
      body: { productId, rating: form.rating, comment: form.comment || undefined },
    })
    form.rating = 0
    form.comment = ''
    await Promise.all([refreshReviews(), refreshEligibility(), refreshNuxtData(productKey)])
    toast.add({ title: 'Đã gửi đánh giá, cảm ơn bạn!', color: 'success', icon: 'i-lucide-check-circle' })
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể gửi đánh giá'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    submitting.value = false
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('vi-VN')
}
</script>

<template>
  <div class="mt-10 border-t border-default pt-8">
    <h2 class="mb-4 flex items-center gap-3 text-xl font-bold text-highlighted">
      Đánh giá sản phẩm
      <span v-if="reviewCount > 0" class="flex items-center gap-1 text-base font-normal text-muted">
        <UIcon name="i-lucide-star" class="size-4 text-warning" style="fill: currentColor" />
        {{ avgRating.toFixed(1) }} ({{ reviewCount }} đánh giá)
      </span>
    </h2>

    <div class="mb-8 rounded-xl border border-default p-5">
      <template v-if="!loggedIn">
        <p class="text-sm text-muted">
          Vui lòng <NuxtLink to="/login" class="font-medium text-primary">đăng nhập</NuxtLink> để đánh giá sản phẩm này.
        </p>
      </template>
      <template v-else-if="eligibility?.alreadyReviewed">
        <p class="flex items-center gap-2 text-sm text-muted">
          <UIcon name="i-lucide-check-circle" class="size-4 text-success" /> Bạn đã đánh giá sản phẩm này.
        </p>
      </template>
      <template v-else-if="!eligibility?.eligible">
        <p class="text-sm text-muted">
          Bạn cần mua và nhận sản phẩm này để đánh giá.
        </p>
      </template>
      <template v-else>
        <h3 class="mb-3 font-semibold text-highlighted">
          Viết đánh giá của bạn
        </h3>
        <div class="mb-3 flex items-center gap-1" @mouseleave="hoverRating = 0">
          <button
            v-for="star in 5"
            :key="star"
            type="button"
            @mouseenter="hoverRating = star"
            @click="form.rating = star"
          >
            <UIcon
              name="i-lucide-star"
              class="size-7 transition"
              :class="(hoverRating || form.rating) >= star ? 'text-warning' : 'text-muted'"
              :style="(hoverRating || form.rating) >= star ? { fill: 'currentColor' } : undefined"
            />
          </button>
        </div>
        <UTextarea
          v-model="form.comment"
          placeholder="Chia sẻ cảm nhận của bạn về sản phẩm (không bắt buộc)..."
          class="w-full"
          :rows="3"
        />
        <UButton class="mt-3" :loading="submitting" @click="submitReview">
          Gửi đánh giá
        </UButton>
      </template>
    </div>

    <div v-if="!reviews?.data.length" class="py-6 text-center text-sm text-muted">
      Chưa có đánh giá nào cho sản phẩm này.
    </div>
    <div v-else class="space-y-5">
      <div v-for="review in reviews.data" :key="review.id" class="border-b border-default pb-5 last:border-0">
        <div class="flex items-center justify-between">
          <p class="font-medium text-highlighted">
            {{ review.user.name }}
          </p>
          <p class="text-xs text-muted">
            {{ formatDate(review.createdAt) }}
          </p>
        </div>
        <div class="mt-1 flex items-center gap-0.5">
          <UIcon
            v-for="star in 5"
            :key="star"
            name="i-lucide-star"
            class="size-4"
            :class="review.rating >= star ? 'text-warning' : 'text-muted'"
            :style="review.rating >= star ? { fill: 'currentColor' } : undefined"
          />
        </div>
        <p v-if="review.comment" class="mt-2 text-sm text-muted">
          {{ review.comment }}
        </p>
      </div>
    </div>

    <div v-if="reviews && reviews.meta.totalPages > 1" class="mt-6 flex justify-center">
      <UPagination
        v-model:page="page"
        :total="reviews.meta.total"
        :items-per-page="reviews.meta.limit"
      />
    </div>
  </div>
</template>
