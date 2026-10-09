<script setup lang="ts">
import type { Category, PaginatedResult, Product } from '#shared/types/catalog'
import type { ImageRow } from './ImageListUploader.vue'

const props = defineProps<{
  categories: Category[]
  initial?: Product
  loading?: boolean
}>()

const emit = defineEmits<{ submit: [payload: Record<string, unknown>], cancel: [] }>()

interface ItemRow {
  variantId: string
  productName: string
  image: string | null
  unit: string
  price: number
  quantity: number
  /** Sản phẩm thành phần đang ẩn/ngừng bán — combo sẽ hết hàng cho tới khi gỡ ra. */
  unavailable: boolean
}

const form = reactive({
  name: props.initial?.name ?? '',
  slug: props.initial?.slug ?? '',
  description: props.initial?.description ?? '',
  status: props.initial?.status ?? 'ACTIVE',
  isFeatured: props.initial?.isFeatured ?? false,
  discount: props.initial?.comboDiscount != null ? Number(props.initial.comboDiscount) : 0,
})

const slugTouched = ref(Boolean(props.initial))
watch(() => form.name, (name) => {
  if (!slugTouched.value) form.slug = slugify(name)
})

const images = ref<ImageRow[]>(
  props.initial?.images.map(img => ({ id: img.id, url: img.url, alt: img.alt ?? '' })) ?? [],
)

const items = ref<ItemRow[]>(
  props.initial?.comboItems.map(item => ({
    variantId: item.variantId,
    productName: item.variant.product.name,
    image: item.variant.product.images[0]?.url ?? null,
    unit: item.variant.unit,
    price: Number(item.variant.price),
    quantity: item.quantity,
    unavailable: item.variant.product.status !== 'ACTIVE' || Boolean(item.variant.product.deletedAt),
  })) ?? [],
)

const originalTotal = computed(() => items.value.reduce((sum, item) => sum + item.price * (item.quantity || 0), 0))
const salePrice = computed(() => Math.max(originalTotal.value - (form.discount || 0), 0))
const discountInvalid = computed(() => items.value.length > 0 && (form.discount || 0) >= originalTotal.value)

function removeItem(index: number) {
  items.value.splice(index, 1)
}

// ---------------------------------------------------------------------------
// Ảnh ghép tự động (app/utils/comboCollage.ts) — luôn là ảnh đầu tiên của combo
// ---------------------------------------------------------------------------

const itemsSignature = computed(() => items.value.map(i => `${i.variantId}:${i.quantity}`).join('|'))
const collageImage = computed(() => images.value.find(img => isComboCollageUrl(img.url)))
/**
 * Danh sách món mà ảnh ghép hiện tại được tạo từ — ảnh ghép có sẵn lúc mở form
 * coi như khớp với danh sách món ban đầu. Khi lưu: chỉ tạo lại nếu danh sách món
 * đã đổi so với lần ghép gần nhất; nếu admin tự xoá ảnh ghép mà không đổi món
 * thì tôn trọng, không tạo lại.
 */
const collageSignature = ref<string | null>(collageImage.value ? itemsSignature.value : null)
const generatingCollage = ref(false)
const collageZoomOpen = ref(false)

async function generateCollage() {
  generatingCollage.value = true
  try {
    const blob = await buildComboCollage(items.value.map(item => ({
      imageUrl: item.image,
      productName: item.productName,
      unit: item.unit,
      quantity: item.quantity,
    })))
    const body = new FormData()
    body.append('file', new File([blob], `${form.slug || 'combo'}-anh-ghep.jpg`, { type: 'image/jpeg' }))
    body.append('folder', COMBO_COLLAGE_FOLDER)
    const res = await $fetch<{ url: string }>('/api/admin/uploads', { method: 'POST', body })

    // Thay ảnh ghép cũ: ảnh chưa lưu thì xoá file ngay, ảnh đã lưu (có id) để
    // server dọn khi bấm Lưu (giống removeImage ở ImageListUploader).
    for (const old of images.value.filter(img => isComboCollageUrl(img.url))) {
      if (!old.id) deleteUploadedImage(old.url)
    }
    images.value = [
      { url: res.url, alt: `${form.name || 'Combo'} — ảnh ghép` },
      ...images.value.filter(img => !isComboCollageUrl(img.url)),
    ]
    collageSignature.value = itemsSignature.value
    return true
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? (err as Error)?.message ?? 'Không tạo được ảnh ghép'
    toast.add({ title: 'Lỗi tạo ảnh ghép', description: message, color: 'error' })
    return false
  } finally {
    generatingCollage.value = false
  }
}

// ---------------------------------------------------------------------------
// Popup chọn sản phẩm: Danh mục -> Sản phẩm -> Đơn vị -> Số lượng
// ---------------------------------------------------------------------------

const pickerOpen = ref(false)
const pickerCategoryId = ref<string | undefined>()
const pickerProductId = ref<string | undefined>()
const pickerVariantId = ref<string | undefined>()
const pickerQuantity = ref(1)
const pickerProducts = ref<Product[]>([])
const pickerLoading = ref(false)
const toast = useToast()

const categoryItems = computed(() => props.categories.map(c => ({ label: c.name, value: c.id })))
const productItems = computed(() => pickerProducts.value.map(p => ({ label: p.name, value: p.id })))
const pickedProduct = computed(() => pickerProducts.value.find(p => p.id === pickerProductId.value))
const variantItems = computed(() => pickedProduct.value?.variants.map(v => ({
  label: `${v.unit} — ${formatVnd(v.price)}${v.stock <= 0 ? ' (hết hàng)' : ''}`,
  value: v.id,
})) ?? [])
const pickedVariant = computed(() => pickedProduct.value?.variants.find(v => v.id === pickerVariantId.value))

function openPicker() {
  pickerCategoryId.value = undefined
  pickerProductId.value = undefined
  pickerVariantId.value = undefined
  pickerQuantity.value = 1
  pickerProducts.value = []
  pickerOpen.value = true
}

watch(pickerCategoryId, async (categoryId) => {
  pickerProductId.value = undefined
  pickerVariantId.value = undefined
  pickerProducts.value = []
  const category = props.categories.find(c => c.id === categoryId)
  if (!category) return
  pickerLoading.value = true
  try {
    const res = await $fetch<PaginatedResult<Product>>('/api/products', {
      query: { category: category.slug, status: 'ACTIVE', limit: 100, sort: 'name_asc' },
    })
    pickerProducts.value = res.data.filter(p => !p.deletedAt)
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể tải sản phẩm'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    pickerLoading.value = false
  }
})

watch(pickerProductId, () => {
  const product = pickedProduct.value
  pickerVariantId.value = product?.variants.length === 1
    ? product.variants[0]!.id
    : product?.variants.find(v => v.isDefault)?.id
})

function addPickedItem() {
  const product = pickedProduct.value
  const variant = pickedVariant.value
  if (!product || !variant) return
  const quantity = Math.max(1, pickerQuantity.value || 1)
  const existing = items.value.find(i => i.variantId === variant.id)
  if (existing) {
    existing.quantity += quantity
  } else {
    items.value.push({
      variantId: variant.id,
      productName: product.name,
      image: product.images[0]?.url ?? null,
      unit: variant.unit,
      price: Number(variant.price),
      quantity,
      unavailable: false,
    })
  }
  pickerOpen.value = false
}

async function submit() {
  // Chưa bấm "Tạo ảnh ghép" (hoặc đã đổi món sau lần ghép trước) thì tự tạo —
  // lỗi ghép ảnh không chặn việc lưu combo, chỉ báo toast.
  if (items.value.length && collageSignature.value !== itemsSignature.value) {
    await generateCollage()
  }
  emit('submit', {
    name: form.name,
    slug: form.slug,
    description: form.description || undefined,
    status: form.status,
    isFeatured: form.isFeatured,
    images: images.value.map((img, idx) => ({ id: img.id, url: img.url, alt: img.alt || undefined, position: idx })),
    items: items.value.map(item => ({ variantId: item.variantId, quantity: item.quantity })),
    discount: form.discount || 0,
  })
}
</script>

<template>
  <div class="space-y-6">
    <UCard>
      <template #header>
        <h2 class="font-semibold text-highlighted">
          Thông tin combo
        </h2>
      </template>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <UFormField label="Tên combo" required class="sm:col-span-2">
          <UInput v-model="form.name" placeholder="Vd: Combo lẩu hải sản 4 người" class="w-full" />
        </UFormField>
        <UFormField label="Slug" required>
          <UInput v-model="form.slug" class="w-full" @input="slugTouched = true" />
        </UFormField>
        <UFormField label="Trạng thái">
          <USelect
            v-model="form.status"
            :items="[{ label: 'Đang bán', value: 'ACTIVE' }, { label: 'Ngừng bán', value: 'INACTIVE' }]"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Mô tả" class="sm:col-span-2">
          <UTextarea v-model="form.description" :rows="3" class="w-full" />
        </UFormField>
        <UCheckbox v-model="form.isFeatured" label="Combo nổi bật (ưu tiên hiển thị đầu tiên)" class="sm:col-span-2" />
      </div>
    </UCard>

    <AdminImageListUploader v-model="images" :default-alt="form.name" />

    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-highlighted">
            Sản phẩm trong combo
          </h2>
          <div class="flex gap-2">
            <UButton
              icon="i-lucide-images"
              size="sm"
              variant="outline"
              color="neutral"
              :loading="generatingCollage"
              :disabled="!items.length || generatingCollage"
              @click="generateCollage"
            >
              {{ collageImage ? 'Tạo lại ảnh ghép' : 'Tạo ảnh ghép' }}
            </UButton>
            <UButton icon="i-lucide-plus" size="sm" variant="outline" @click="openPicker">
              Thêm sản phẩm
            </UButton>
          </div>
        </div>
      </template>

      <div v-if="collageImage" class="mb-4 flex flex-wrap items-start gap-4 rounded-lg bg-elevated p-3">
        <button
          type="button"
          class="group relative w-56 max-w-full cursor-zoom-in overflow-hidden rounded-lg border border-default"
          title="Bấm để xem lớn"
          @click="collageZoomOpen = true"
        >
          <img :src="collageImage.url" :alt="collageImage.alt" class="w-full transition group-hover:scale-105">
          <span class="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white">
            <UIcon name="i-lucide-zoom-in" class="size-4" />
          </span>
        </button>
        <div class="min-w-48 flex-1 space-y-1 text-sm">
          <p class="font-medium text-highlighted">
            Ảnh ghép (ảnh đại diện combo)
          </p>
          <p v-if="collageSignature !== itemsSignature" class="text-warning">
            Danh sách món đã thay đổi — ảnh ghép sẽ được tạo lại khi bấm Lưu.
          </p>
          <p v-else class="text-muted">
            Đã nằm ở vị trí đầu tiên trong phần Hình ảnh. Xoá ở đó nếu không muốn dùng.
          </p>
        </div>
      </div>

      <div v-if="!items.length" class="py-6 text-center text-sm text-muted">
        Chưa có sản phẩm nào — bấm "Thêm sản phẩm" để chọn.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="text-left text-xs uppercase text-muted">
            <tr>
              <th class="py-2 pr-3">
                Sản phẩm
              </th>
              <th class="py-2 pr-3">
                Đơn vị
              </th>
              <th class="py-2 pr-3 text-right">
                Đơn giá
              </th>
              <th class="w-32 py-2 pr-3">
                Số lượng
              </th>
              <th class="py-2 pr-3 text-right">
                Thành tiền
              </th>
              <th class="w-10" />
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr v-for="(item, idx) in items" :key="item.variantId">
              <td class="py-2 pr-3">
                <div class="flex items-center gap-2">
                  <img :src="item.image ?? '/images/placeholder-fish.svg'" :alt="item.productName" class="size-9 rounded object-cover">
                  <div>
                    <span class="font-medium text-highlighted">{{ item.productName }}</span>
                    <UBadge v-if="item.unavailable" color="error" variant="subtle" size="sm" class="ml-1">
                      Đang ẩn
                    </UBadge>
                  </div>
                </div>
              </td>
              <td class="py-2 pr-3">
                {{ item.unit }}
              </td>
              <td class="py-2 pr-3 text-right">
                {{ formatVnd(item.price) }}
              </td>
              <td class="py-2 pr-3">
                <UInputNumber v-model="item.quantity" :min="1" size="sm" />
              </td>
              <td class="py-2 pr-3 text-right font-medium">
                {{ formatVnd(item.price * (item.quantity || 0)) }}
              </td>
              <td class="py-2 text-right">
                <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="sm" @click="removeItem(idx)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-4 ml-auto max-w-sm space-y-3 border-t border-default pt-4">
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted">Tổng giá gốc</span>
          <span class="font-medium text-highlighted">{{ formatVnd(originalTotal) }}</span>
        </div>
        <div class="flex items-center justify-between gap-3 text-sm">
          <span class="shrink-0 text-muted">Số tiền giảm</span>
          <div class="flex items-center gap-2">
            <UInputNumber v-model="form.discount" :min="0" :step="1000" size="sm" class="w-40" />
            <span class="text-muted">đ</span>
          </div>
        </div>
        <p v-if="discountInvalid" class="text-xs text-error">
          Số tiền giảm phải nhỏ hơn tổng giá gốc.
        </p>
        <div class="flex items-center justify-between border-t border-default pt-3">
          <span class="font-semibold text-highlighted">Giá bán combo</span>
          <span class="text-lg font-bold text-primary">{{ formatVnd(salePrice) }}</span>
        </div>
        <p class="text-xs text-muted">
          Giá gốc tự cập nhật theo giá hiện tại của từng sản phẩm; tồn kho combo tính theo tồn kho các sản phẩm bên trong.
        </p>
      </div>
    </UCard>

    <div class="flex justify-end gap-3">
      <UButton color="neutral" variant="outline" :disabled="loading" @click="emit('cancel')">
        Huỷ
      </UButton>
      <UButton :loading="loading || generatingCollage" :disabled="loading || generatingCollage || !items.length || discountInvalid" @click="submit">
        Lưu combo
      </UButton>
    </div>

    <UModal
      v-model:open="collageZoomOpen"
      title="Xem ảnh ghép"
      :ui="{ content: 'sm:max-w-4xl' }"
    >
      <template #body>
        <img
          v-if="collageImage"
          :src="collageImage.url"
          :alt="collageImage.alt"
          class="mx-auto max-h-[80vh] w-auto rounded-lg"
        >
      </template>
    </UModal>

    <UModal v-model:open="pickerOpen" title="Thêm sản phẩm vào combo">
      <template #body>
        <div class="space-y-4">
          <UFormField label="1. Danh mục">
            <USelectMenu
              v-model="pickerCategoryId"
              value-key="value"
              :items="categoryItems"
              placeholder="Chọn danh mục"
              class="w-full"
            />
          </UFormField>
          <UFormField label="2. Sản phẩm">
            <USelectMenu
              v-model="pickerProductId"
              value-key="value"
              :items="productItems"
              :loading="pickerLoading"
              :disabled="!pickerCategoryId || pickerLoading"
              :placeholder="pickerCategoryId && !pickerLoading && !productItems.length ? 'Danh mục này chưa có sản phẩm' : 'Chọn sản phẩm'"
              class="w-full"
            />
          </UFormField>
          <UFormField label="3. Đơn vị">
            <USelect
              v-model="pickerVariantId"
              :items="variantItems"
              :disabled="!pickedProduct"
              placeholder="Chọn đơn vị"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Số lượng">
            <UInputNumber v-model="pickerQuantity" :min="1" class="w-full" />
          </UFormField>
          <div v-if="pickedVariant" class="flex items-center justify-between rounded-lg bg-elevated px-3 py-2 text-sm">
            <span class="text-muted">Cộng vào tổng giá gốc</span>
            <span class="font-semibold text-highlighted">{{ formatVnd(Number(pickedVariant.price) * (pickerQuantity || 1)) }}</span>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="outline" @click="pickerOpen = false">
            Huỷ
          </UButton>
          <UButton icon="i-lucide-plus" :disabled="!pickedVariant" @click="addPickedItem">
            Thêm vào combo
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
