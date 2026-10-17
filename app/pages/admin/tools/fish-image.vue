<script setup lang="ts">
import type { PaginatedResult, Product } from '#shared/types/catalog'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const toast = useToast()

// Tải toàn bộ sản phẩm thường (không combo) đang bán để chọn — API giới hạn 100/trang.
const products = ref<Product[]>([])
const productsLoading = ref(true)

onMounted(async () => {
  try {
    let page = 1
    let totalPages = 1
    const all: Product[] = []
    do {
      const res = await $fetch<PaginatedResult<Product>>('/api/products', {
        query: { status: 'ACTIVE', limit: 100, sort: 'name_asc', page },
      })
      all.push(...res.data.filter(p => !p.deletedAt))
      totalPages = res.meta.totalPages
      page++
    } while (page <= totalPages)
    products.value = all
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể tải sản phẩm'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    productsLoading.value = false
  }
})

const productId = ref<string>()
const imageUrl = ref<string | null>(null)
const variantId = ref<string>()
const name = ref('')
const cookingTips = ref('')
const brand = ref('')
const showPrice = ref(true)

const product = computed(() => products.value.find(p => p.id === productId.value))
const variant = computed(() => product.value?.variants.find(v => v.id === variantId.value))

const productItems = computed(() => products.value.map(p => ({
  label: p.name,
  value: p.id,
  avatar: p.images[0] ? { src: p.images[0].url, alt: p.name } : undefined,
})))

const variantItems = computed(() => (product.value?.variants ?? []).map(v => ({
  label: `${formatVnd(v.price)}/${v.unit}`,
  value: v.id,
})))

const priceLabel = computed(() => (variant.value ? `${formatVnd(variant.value.price)}/${variant.value.unit}` : ''))

watch(product, (p) => {
  name.value = p?.name ?? ''
  imageUrl.value = p?.images[0]?.url ?? null
  variantId.value = (p?.variants.find(v => v.isDefault) ?? p?.variants[0])?.id
})

// ---------------------------------------------------------------------------
// Xem trước — vẽ lại (debounce) mỗi khi đổi dữ liệu
// ---------------------------------------------------------------------------

const previewUrl = ref<string | null>(null)
const previewBlob = ref<Blob | null>(null)
const rendering = ref(false)
let renderToken = 0

async function render() {
  if (!product.value) return
  const token = ++renderToken
  rendering.value = true
  try {
    const blob = await buildFishPoster({
      imageUrl: imageUrl.value,
      name: name.value,
      priceLabel: showPrice.value ? priceLabel.value : '',
      cookingTips: cookingTips.value,
      brand: brand.value,
    })
    if (token !== renderToken) return
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewBlob.value = blob
    previewUrl.value = URL.createObjectURL(blob)
  } catch (err) {
    toast.add({ title: 'Lỗi', description: (err as Error).message || 'Không tạo được ảnh', color: 'error' })
  } finally {
    if (token === renderToken) rendering.value = false
  }
}

watchDebounced([product, imageUrl, name, priceLabel, showPrice, cookingTips, brand], render, { debounce: 300 })

onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})

function download() {
  if (!previewUrl.value) return
  const link = document.createElement('a')
  link.href = previewUrl.value
  link.download = `${product.value?.slug ?? 'anh-ca'}.jpg`
  link.click()
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-highlighted">Tạo ảnh cá bản quyền</h1>
      <p class="text-sm text-muted">
        Chọn sản phẩm để tạo ảnh có thẻ tên, giá, gợi ý nấu và chữ thương hiệu mờ giữa ảnh, rồi tải về máy.
      </p>
    </div>

    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
      <UCard>
        <div class="space-y-4">
          <UFormField label="Sản phẩm" required>
            <USelectMenu
              v-model="productId"
              value-key="value"
              :items="productItems"
              :loading="productsLoading"
              :disabled="productsLoading"
              placeholder="Chọn sản phẩm"
              class="w-full"
            />
          </UFormField>

          <UFormField v-if="product" label="Ảnh">
            <div v-if="product.images.length" class="flex flex-wrap gap-2">
              <button
                v-for="img in product.images"
                :key="img.id"
                type="button"
                class="size-20 overflow-hidden rounded-md border-2 transition"
                :class="imageUrl === img.url ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'"
                @click="imageUrl = img.url"
              >
                <img :src="img.url" :alt="img.alt ?? product.name" class="size-full object-cover" loading="lazy">
              </button>
            </div>
            <p v-else class="text-sm text-muted">Sản phẩm chưa có ảnh — sẽ dùng ảnh mặc định.</p>
          </UFormField>

          <UFormField label="Tên cá trên thẻ" help="Mặc định lấy tên sản phẩm, có thể sửa cho gọn.">
            <UInput v-model="name" :disabled="!product" class="w-full" />
          </UFormField>

          <UFormField label="Giá / đơn vị">
            <template #hint>
              <USwitch v-model="showPrice" label="Hiện giá trên ảnh" :disabled="!product" />
            </template>
            <USelect
              v-model="variantId"
              :items="variantItems"
              :disabled="!product || !showPrice"
              placeholder="Chọn đơn vị"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Gợi ý nấu" help="Ví dụ: chiên, hấp, cháo. Bỏ trống thì không có dải gợi ý phía dưới.">
            <UInput v-model="cookingTips" :disabled="!product" placeholder="chiên, hấp, cháo" class="w-full" />
          </UFormField>

          <UFormField label="Tên thương hiệu" :help="`Bỏ trống sẽ dùng ${DEFAULT_POSTER_BRAND}.`">
            <UInput v-model="brand" :disabled="!product" :placeholder="DEFAULT_POSTER_BRAND" class="w-full" />
          </UFormField>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-2">
            <span class="font-semibold text-highlighted">Xem trước</span>
            <UButton
              icon="i-lucide-download"
              label="Lưu ảnh về máy"
              :disabled="!previewUrl || rendering"
              @click="download"
            />
          </div>
        </template>
        <div class="relative aspect-[4/5] overflow-hidden rounded-md bg-elevated">
          <img v-if="previewUrl" :src="previewUrl" alt="Xem trước ảnh cá" class="size-full object-contain">
          <div v-else class="flex size-full items-center justify-center p-6 text-center text-sm text-muted">
            Chọn sản phẩm để xem trước ảnh
          </div>
          <div v-if="rendering" class="absolute inset-0 flex items-center justify-center bg-default/40">
            <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary" />
          </div>
        </div>
        <p class="mt-2 text-xs text-muted">Kích thước 1080 × 1350 (4:5), định dạng JPG.</p>
      </UCard>
    </div>
  </div>
</template>
