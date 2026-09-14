<script setup lang="ts">
import type { CouponPromoView } from '#shared/types/coupon'

defineProps<{
  coupons: CouponPromoView[]
}>()

const toast = useToast()
const { copy } = useClipboard()

function copyCode(code: string) {
  copy(code)
  toast.add({ title: `Đã sao chép mã "${code}"`, color: 'success', icon: 'i-lucide-check-circle' })
}

function discountHeadline(coupon: CouponPromoView) {
  if (coupon.type === 'PERCENTAGE') {
    const suffix = coupon.maxDiscount ? ` (tối đa ${formatVnd(coupon.maxDiscount)})` : ''
    return `Giảm ${Number(coupon.value)}%${suffix}`
  }
  return `Giảm ${formatVnd(coupon.value)}`
}

function conditionSummary(coupon: CouponPromoView) {
  const minOrder = coupon.minOrderValue && Number(coupon.minOrderValue) > 0
    ? `Đơn từ ${formatVnd(coupon.minOrderValue)}`
    : 'Mọi đơn hàng'
  const usage = coupon.usageLimit ? `Giới hạn ${coupon.usageLimit} lượt` : 'Không giới hạn lượt dùng'
  return `${minOrder} · ${usage}`
}
</script>

<template>
  <section v-if="coupons.length" class="bg-elevated py-8">
    <UContainer>
      <div class="mb-4 flex items-center gap-2">
        <UIcon name="i-lucide-ticket-percent" class="size-5 text-primary" />
        <h2 class="text-lg font-bold text-highlighted">
          Mã giảm giá dành cho bạn
        </h2>
      </div>

      <UCarousel
        :items="coupons"
        align="start"
        arrows
        :prev="{ color: 'neutral', variant: 'solid' }"
        :next="{ color: 'neutral', variant: 'solid' }"
        :ui="{
          item: 'basis-auto shrink-0',
          prev: 'start-2 sm:start-2 shadow-md disabled:hidden',
          next: 'end-2 sm:end-2 shadow-md disabled:hidden',
        }"
      >
        <template #default="{ item: coupon }">
          <div class="relative w-64 shrink-0 select-none overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 sm:w-72 dark:bg-primary/15">
            <div class="p-4 pb-3">
              <div class="flex items-center gap-2 text-primary">
                <UIcon name="i-lucide-ticket-percent" class="size-5 shrink-0" />
                <p class="font-bold text-highlighted">
                  {{ discountHeadline(coupon) }}
                </p>
              </div>
              <p class="mt-1 text-xs text-muted">
                {{ conditionSummary(coupon) }}
              </p>
              <UBadge size="xs" variant="subtle" color="primary" class="mt-2">
                {{ coupon.categoryName }}
              </UBadge>
            </div>

            <div class="relative border-t border-dashed border-primary/30">
              <span class="absolute -left-2 top-1/2 size-4 -translate-y-1/2 rounded-full bg-elevated" />
              <span class="absolute -right-2 top-1/2 size-4 -translate-y-1/2 rounded-full bg-elevated" />
            </div>

            <div class="flex items-center justify-between gap-2 p-3 pt-3">
              <div class="min-w-0">
                <p class="text-[10px] uppercase tracking-wide text-muted">
                  Nhập mã
                </p>
                <p class="truncate font-mono font-bold tracking-wider text-highlighted">
                  {{ coupon.code }}
                </p>
              </div>
              <UButton size="sm" variant="subtle" color="primary" icon="i-lucide-copy" class="shrink-0" @click="copyCode(coupon.code)">
                Sao chép
              </UButton>
            </div>
          </div>
        </template>
      </UCarousel>
    </UContainer>
  </section>
</template>
