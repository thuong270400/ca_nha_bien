<script setup lang="ts">
import type { Product } from '#shared/types/catalog'

const props = defineProps<{ product: Product }>()

const { loggedIn, user } = useUserSession()
const wishlistStore = useWishlistStore()
const router = useRouter()
const wishlisting = ref(false)
const quickBuyOpen = ref(false)
const editOpen = ref(false)

const isAdmin = computed(() => user.value?.role === 'ADMIN')

// Local copy so a save in ProductEditDialog updates this card immediately
// without needing the parent list to refetch.
const product = ref<Product>(props.product)
watch(() => props.product, (p) => { product.value = p })

function onProductUpdated(updated: Product) {
  product.value = updated
}

const isWishlisted = computed(() => wishlistStore.has(product.value.id))

async function onToggleWishlist() {
  if (!loggedIn.value) {
    router.push('/login')
    return
  }
  wishlisting.value = true
  try {
    await wishlistStore.toggle(product.value.id)
  } finally {
    wishlisting.value = false
  }
}

const imageTags = computed(() => product.value.tags.filter(t => t.showOnImage))
const labelTags = computed(() => product.value.tags.filter(t => !t.showOnImage))
const defaultVariant = computed(() => product.value.variants.find(v => v.isDefault) ?? product.value.variants[0])
const coverImage = computed(() => product.value.images[0]?.url ?? '/images/placeholder-fish.svg')
const hoverImage = computed(() => product.value.images[1]?.url ?? null)
const totalStock = computed(() => product.value.variants.reduce((sum, v) => sum + v.stock, 0))
const discountPercent = computed(() => {
  const price = Number(product.value.price)
  const compareAt = product.value.compareAtPrice ? Number(product.value.compareAtPrice) : null
  if (!compareAt || compareAt <= price) return null
  return Math.round((1 - price / compareAt) * 100)
})
</script>

<template>
  <NuxtLink
    :to="`/products/${product.slug}`"
    class="group flex flex-col overflow-hidden rounded-xl border border-default bg-default transition hover:shadow-lg"
  >
    <div class="relative aspect-square overflow-hidden bg-default">
      <img
        :src="coverImage"
        :alt="product.images[0]?.alt ?? product.name"
        class="absolute inset-0 size-full object-cover transition-all duration-500 ease-out"
        :class="hoverImage ? 'group-hover:opacity-0' : 'group-hover:-translate-y-4'"
        loading="lazy"
      >
      <img
        v-if="hoverImage"
        :src="hoverImage"
        :alt="product.images[1]?.alt ?? product.name"
        class="absolute inset-0 size-full object-cover opacity-0 transition-all duration-500 ease-out group-hover:-translate-y-4 group-hover:opacity-100"
        loading="lazy"
      >
      <div v-if="imageTags.length || discountPercent" class="absolute left-2 top-2 flex flex-col items-start gap-1">
        <span
          v-for="tag in imageTags"
          :key="tag.id"
          class="rounded px-2 py-0.5 text-[11px] font-semibold"
          :style="{ backgroundColor: tag.color, color: tagTextColor(tag.color) }"
        >
          {{ tag.name }}
        </span>
        <UBadge v-if="discountPercent" color="error">
          -{{ discountPercent }}%
        </UBadge>
      </div>
      <UBadge
        v-if="totalStock === 0"
        color="neutral"
        class="absolute right-2 top-2"
      >
        Hết hàng
      </UBadge>
      <button
        type="button"
        class="absolute bottom-2 right-2 flex size-8 items-center justify-center rounded-full bg-default/90 shadow transition hover:scale-110"
        :aria-label="isWishlisted ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'"
        @click.stop.prevent="onToggleWishlist"
      >
        <UIcon
          name="i-lucide-heart"
          class="size-4"
          :class="isWishlisted ? 'text-error' : 'text-muted'"
          :style="isWishlisted ? { fill: 'currentColor' } : undefined"
        />
      </button>
      <button
        v-if="isAdmin"
        type="button"
        class="absolute bottom-2 left-2 flex size-8 items-center justify-center rounded-full bg-default/90 shadow transition hover:scale-110"
        aria-label="Chỉnh sửa sản phẩm"
        title="Chỉnh sửa sản phẩm"
        @click.stop.prevent="editOpen = true"
      >
        <UIcon name="i-lucide-pencil" class="size-4 text-primary" />
      </button>
    </div>

    <div class="flex flex-1 flex-col gap-1 p-3">
      <p class="text-[11px] text-muted">
        {{ product.categories.map(c => c.name).join(', ') }}
      </p>
      <h3 class="line-clamp-2 text-sm font-medium text-highlighted">
        {{ product.name }}
      </h3>
      <div v-if="labelTags.length" class="flex flex-wrap gap-1">
        <span
          v-for="tag in labelTags"
          :key="tag.id"
          class="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium"
          :style="{ backgroundColor: tag.color, color: tagTextColor(tag.color) }"
        >
          {{ tag.name }}
        </span>
      </div>
      <div class="mt-auto flex items-end justify-between gap-2 pt-2">
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <span class="truncate text-sm font-bold text-primary">{{ formatVnd(product.price) }}</span>
            <span v-if="product.compareAtPrice" class="truncate text-xs text-muted line-through">
              {{ formatVnd(product.compareAtPrice) }}
            </span>
          </div>
          <p v-if="defaultVariant" class="text-[11px] text-muted">
            {{ unitLabel(defaultVariant.unit) }}
          </p>
        </div>
        <button
          type="button"
          class="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-inverted shadow transition hover:scale-110 hover:bg-secondary/90 disabled:pointer-events-none disabled:opacity-50"
          :disabled="totalStock === 0"
          :title="totalStock === 0 ? 'Hết hàng' : 'Chọn mua'"
          :aria-label="totalStock === 0 ? 'Hết hàng' : 'Chọn mua'"
          @click.stop.prevent="quickBuyOpen = true"
        >
          <UIcon name="i-lucide-shopping-bag" class="size-4" />
        </button>
      </div>
    </div>
  </NuxtLink>

  <StorefrontProductQuickBuyModal v-model:open="quickBuyOpen" :product="product" />
  <StorefrontProductEditDialog
    v-if="isAdmin"
    v-model:open="editOpen"
    :product="product"
    @updated="onProductUpdated"
  />
</template>
