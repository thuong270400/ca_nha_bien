<script setup lang="ts">
import type { Product, ProductDetail } from '#shared/types/catalog'
import { formatDays } from '#shared/utils/sourcing'

const route = useRoute()
const slug = route.params.slug as string

const { data: product } = await useFetch<ProductDetail>(`/api/products/slug/${slug}`, {
  key: `product-${slug}`,
})

if (!product.value) {
  throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy sản phẩm', fatal: true })
}

const selectedImageIndex = ref(0)
const selectedVariantId = ref(
  product.value.variants.find(v => v.isDefault)?.id ?? product.value.variants[0]?.id,
)
const quantity = ref(1)

const selectedVariant = computed(() =>
  product.value?.variants.find(v => v.id === selectedVariantId.value),
)

const discountPercent = computed(() => {
  const variant = selectedVariant.value
  if (!variant?.compareAtPrice) return null
  const price = Number(variant.price)
  const compareAt = Number(variant.compareAtPrice)
  if (compareAt <= price) return null
  return Math.round((1 - price / compareAt) * 100)
})

watch(selectedVariantId, () => { quantity.value = 1 })

const cartStore = useCartStore()
const wishlistStore = useWishlistStore()
const { loggedIn, user } = useUserSession()
const router = useRouter()
const toast = useToast()
const adding = ref(false)
const wishlisting = ref(false)
const editOpen = ref(false)

const isAdmin = computed(() => user.value?.role === 'ADMIN')
const isWishlisted = computed(() => product.value ? wishlistStore.has(product.value.id) : false)
const imageTags = computed(() => product.value?.tags.filter(t => t.showOnImage) ?? [])
const labelTags = computed(() => product.value?.tags.filter(t => !t.showOnImage) ?? [])

function onProductUpdated(updated: Product) {
  if (!product.value) return
  Object.assign(product.value, updated)
  selectedVariantId.value = product.value.variants.find(v => v.isDefault)?.id ?? product.value.variants[0]?.id
  selectedImageIndex.value = 0
}

async function onToggleWishlist() {
  if (!product.value) return
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

async function addToCart() {
  if (!product.value || !selectedVariant.value) return
  adding.value = true
  try {
    await cartStore.addItem(selectedVariant.value.id, quantity.value)
    toast.add({ title: 'Đã thêm vào giỏ hàng', description: product.value.name, color: 'success', icon: 'i-lucide-check-circle' })
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể thêm vào giỏ hàng'
    toast.add({ title: 'Lỗi', description: message, color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    adding.value = false
  }
}

useSeoMeta({
  title: () => `${product.value?.name} - Cá Nhà Biển`,
  description: () => product.value?.description || `Mua ${product.value?.name} tươi ngon tại Cá Nhà Biển`,
  ogTitle: () => product.value?.name,
  ogDescription: () => product.value?.description || undefined,
  ogImage: () => product.value?.images[0]?.url,
})

useCanonical(`/products/${slug}`)

useHead(() => ({
  script: product.value
    ? [{
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Product',
          'name': product.value.name,
          'description': product.value.description ?? undefined,
          'image': product.value.images.map(i => i.url),
          'offers': product.value.variants.map(v => ({
            '@type': 'Offer',
            'price': v.price,
            'priceCurrency': 'VND',
            'availability': v.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          })),
        }),
      }]
    : [],
}))
</script>

<template>
  <UContainer v-if="product" class="py-8">
    <UBreadcrumb
      class="mb-6"
      :items="[
        { label: 'Trang chủ', to: '/' },
        ...(product.categories[0] ? [{ label: product.categories[0].name, to: `/categories/${product.categories[0].slug}` }] : []),
        { label: product.name },
      ]"
    />

    <div class="grid grid-cols-1 gap-10 lg:grid-cols-2">
      <div>
        <div class="relative aspect-square overflow-hidden rounded-xl bg-elevated">
          <img
            :src="product.images[selectedImageIndex]?.url ?? '/images/placeholder-fish.svg'"
            :alt="product.images[selectedImageIndex]?.alt ?? product.name"
            class="size-full object-contain"
          >
          <div v-if="imageTags.length" class="absolute left-3 top-3 flex flex-col items-start gap-1">
            <span
              v-for="tag in imageTags"
              :key="tag.id"
              class="rounded px-2.5 py-1 text-xs font-semibold"
              :style="{ backgroundColor: tag.color, color: tagTextColor(tag.color) }"
            >
              {{ tag.name }}
            </span>
          </div>
        </div>
        <div v-if="product.images.length > 1" class="mt-3 flex gap-2">
          <button
            v-for="(image, idx) in product.images"
            :key="image.id"
            type="button"
            class="size-16 overflow-hidden rounded-lg border-2 transition"
            :class="idx === selectedImageIndex ? 'border-primary' : 'border-default'"
            @click="selectedImageIndex = idx"
          >
            <img :src="image.url" :alt="image.alt ?? product.name" class="size-full object-cover">
          </button>
        </div>
      </div>

      <div>
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-sm text-muted">
              {{ product.categories.map(c => c.name).join(', ') }}
            </p>
            <h1 class="mt-1 text-2xl font-bold text-highlighted">
              {{ product.name }}
            </h1>
            <div v-if="labelTags.length" class="mt-2 flex flex-wrap gap-1.5">
              <span
                v-for="tag in labelTags"
                :key="tag.id"
                class="inline-flex items-center rounded px-2.5 py-0.5 text-xs font-medium"
                :style="{ backgroundColor: tag.color, color: tagTextColor(tag.color) }"
              >
                {{ tag.name }}
              </span>
            </div>
          </div>
          <UButton
            v-if="isAdmin"
            icon="i-lucide-pencil"
            size="sm"
            variant="soft"
            color="primary"
            @click="editOpen = true"
          >
            Chỉnh sửa
          </UButton>
        </div>
        <p v-if="product.origin" class="mt-1 flex items-center gap-1 text-sm text-muted">
          <UIcon name="i-lucide-map-pin" class="size-4" /> Nguồn gốc: {{ product.origin }}
        </p>

        <div v-if="selectedVariant" class="mt-4 flex items-baseline gap-3">
          <span class="text-3xl font-bold text-primary">{{ formatVnd(selectedVariant.price) }}</span>
          <span v-if="selectedVariant.compareAtPrice" class="text-lg text-muted line-through">
            {{ formatVnd(selectedVariant.compareAtPrice) }}
          </span>
          <UBadge v-if="discountPercent" color="error">
            -{{ discountPercent }}%
          </UBadge>
        </div>
        <p v-if="formatDays(product.availabilityDays)" class="mt-2 flex items-center gap-1.5 text-sm text-muted">
          <UIcon name="i-lucide-clock" class="size-4" />
          <span>Dự kiến có hàng: {{ formatDays(product.availabilityDays) }}</span>
        </p>
        <div class="mt-6">
          <p class="mb-2 text-sm font-medium text-highlighted">
            Đơn vị bán
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="variant in product.variants"
              :key="variant.id"
              type="button"
              class="rounded-lg border px-4 py-2 text-sm font-medium transition"
              :class="variant.id === selectedVariantId
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-default text-muted hover:border-primary/50'"
              :disabled="variant.stock === 0"
              @click="selectedVariantId = variant.id"
            >
              {{ variant.unit }}
              <span v-if="variant.stock === 0" class="ml-1 text-xs">(hết hàng)</span>
            </button>
          </div>
        </div>

        <div v-if="selectedVariant" class="mt-6">
          <p class="mb-2 text-sm font-medium text-highlighted">
            Số lượng
          </p>
          <div class="flex items-center gap-4">
            <UInputNumber
              v-model="quantity"
              :min="1"
              :max="Math.max(selectedVariant.stock, 1)"
              :disabled="selectedVariant.stock === 0"
            />
            <span class="text-sm text-muted">
              {{ selectedVariant.stock > 0 ? `Còn ${selectedVariant.stock} ${selectedVariant.unit}` : 'Hết hàng' }}
            </span>
          </div>
        </div>

        <div class="mt-6 flex gap-2">
          <UButton
            class="flex-1"
            size="xl"
            block
            icon="i-lucide-shopping-cart"
            :loading="adding"
            :disabled="!selectedVariant || selectedVariant.stock === 0"
            @click="addToCart"
          >
            {{ selectedVariant?.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ hàng' }}
          </UButton>
          <UButton
            size="xl"
            variant="outline"
            :color="isWishlisted ? 'error' : 'neutral'"
            icon="i-lucide-heart"
            :loading="wishlisting"
            :aria-label="isWishlisted ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'"
            @click="onToggleWishlist"
          />
        </div>

        <div v-if="product.description" class="mt-8 border-t border-default pt-6">
          <h2 class="mb-2 font-semibold text-highlighted">
            Mô tả sản phẩm
          </h2>
          <p class="whitespace-pre-line text-sm text-muted">
            {{ product.description }}
          </p>
        </div>

      </div>
    </div>

    <StorefrontSuggestedDishes :dishes="product.suggestedDishes" />

    <StorefrontProductSection
      v-if="product.related.length"
      title="Sản phẩm liên quan"
      :products="product.related"
    />

    <StorefrontProductReviews
      :product-id="product.id"
      :product-key="`product-${slug}`"
      :avg-rating="product.avgRating"
      :review-count="product.reviewCount"
    />

    <StorefrontProductEditDialog
      v-if="isAdmin"
      v-model:open="editOpen"
      :product="product"
      @updated="onProductUpdated"
    />
  </UContainer>
</template>
