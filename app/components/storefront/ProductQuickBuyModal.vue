<script setup lang="ts">
import type { Product } from '#shared/types/catalog'

const open = defineModel<boolean>('open', { default: false })
const { product } = defineProps<{ product: Product }>()

const cartStore = useCartStore()
const router = useRouter()
const toast = useToast()

const selectedVariantId = ref<string | undefined>(undefined)
const quantity = ref(1)
const adding = ref(false)
const buying = ref(false)

function resetSelection() {
  selectedVariantId.value = product.variants.find(v => v.isDefault)?.id ?? product.variants[0]?.id
  quantity.value = 1
}

watch(open, (isOpen) => {
  if (isOpen) resetSelection()
})

const selectedVariant = computed(() => product.variants.find(v => v.id === selectedVariantId.value))

const coverImage = computed(() => product.images[0]?.url ?? '/images/placeholder-fish.svg')

const discountPercent = computed(() => {
  const variant = selectedVariant.value
  if (!variant?.compareAtPrice) return null
  const price = Number(variant.price)
  const compareAt = Number(variant.compareAtPrice)
  if (compareAt <= price) return null
  return Math.round((1 - price / compareAt) * 100)
})

watch(selectedVariantId, () => { quantity.value = 1 })

async function addToCart() {
  if (!selectedVariant.value) return
  adding.value = true
  try {
    await cartStore.addItem(selectedVariant.value.id, quantity.value)
    toast.add({ title: 'Đã thêm vào giỏ hàng', description: product.name, color: 'success', icon: 'i-lucide-check-circle' })
    open.value = false
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể thêm vào giỏ hàng'
    toast.add({ title: 'Lỗi', description: message, color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    adding.value = false
  }
}

async function buyNow() {
  if (!selectedVariant.value) return
  buying.value = true
  try {
    await cartStore.addItem(selectedVariant.value.id, quantity.value)
    open.value = false
    router.push('/checkout')
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể mua sản phẩm này'
    toast.add({ title: 'Lỗi', description: message, color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    buying.value = false
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Chọn phân loại">
    <template #body>
      <div class="flex gap-3">
        <div class="size-20 shrink-0 overflow-hidden rounded-lg bg-elevated">
          <img :src="coverImage" :alt="product.images[0]?.alt ?? product.name" class="size-full object-cover">
        </div>
        <div class="min-w-0">
          <div class="flex items-baseline gap-2">
            <span class="text-xl font-bold text-primary">{{ formatVnd(selectedVariant?.price ?? product.price) }}</span>
            <span v-if="selectedVariant?.compareAtPrice" class="text-sm text-muted line-through">
              {{ formatVnd(selectedVariant.compareAtPrice) }}
            </span>
            <UBadge v-if="discountPercent" color="error" size="sm">
              -{{ discountPercent }}%
            </UBadge>
          </div>
          <p class="mt-1 text-sm text-muted">
            {{ selectedVariant && selectedVariant.stock > 0 ? `Có sẵn: ${selectedVariant.stock}` : 'Hết hàng' }}
          </p>
        </div>
      </div>

      <USeparator class="my-4" />

      <div>
        <p class="mb-2 text-sm font-medium text-muted">
          Phân loại:
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="variant in product.variants"
            :key="variant.id"
            type="button"
            class="flex items-center gap-1 rounded-lg border px-4 py-2 text-sm font-medium transition"
            :class="variant.id === selectedVariantId
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-default text-muted hover:border-primary/50'"
            :disabled="variant.stock === 0"
            @click="selectedVariantId = variant.id"
          >
            <UIcon v-if="variant.id === selectedVariantId" name="i-lucide-check" class="size-3.5" />
            {{ variant.unit }}
            <span v-if="variant.stock === 0" class="text-xs">(hết hàng)</span>
          </button>
        </div>
      </div>

      <div v-if="selectedVariant" class="mt-5 flex items-center justify-between">
        <p class="text-sm font-medium text-muted">
          Số lượng:
        </p>
        <UInputNumber
          v-model="quantity"
          :min="1"
          :max="Math.max(selectedVariant.stock, 1)"
          :disabled="selectedVariant.stock === 0"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex w-full gap-3">
        <UButton
          class="flex-1 justify-center"
          size="lg"
          variant="soft"
          :loading="adding"
          :disabled="!selectedVariant || selectedVariant.stock === 0"
          @click="addToCart"
        >
          Thêm giỏ hàng
        </UButton>
        <UButton
          class="flex-1 justify-center"
          size="lg"
          :loading="buying"
          :disabled="!selectedVariant || selectedVariant.stock === 0"
          @click="buyNow"
        >
          Mua ngay
        </UButton>
      </div>
    </template>
  </UModal>
</template>
