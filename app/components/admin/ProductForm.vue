<script setup lang="ts">
import type { Category, Product, Tag } from '#shared/types/catalog'
import type { ImageRow } from './ImageListUploader.vue'

const props = defineProps<{
  categories: Category[]
  tags: Tag[]
  initial?: Product
  loading?: boolean
}>()

const emit = defineEmits<{ submit: [payload: Record<string, unknown>], cancel: [] }>()

interface VariantRow {
  id?: string
  unit: string
  price: number | undefined
  compareAtPrice: number | undefined
  stock: number
  sku: string
  isDefault: boolean
}

const form = reactive({
  name: props.initial?.name ?? '',
  slug: props.initial?.slug ?? '',
  description: props.initial?.description ?? '',
  origin: props.initial?.origin ?? '',
  status: props.initial?.status ?? 'ACTIVE',
  isFeatured: props.initial?.isFeatured ?? false,
  availabilityDays: props.initial?.availabilityDays ?? undefined,
  importPrice: props.initial?.importPrice != null ? Number(props.initial.importPrice) : undefined,
})

const categoryIds = ref<string[]>(props.initial?.categories.map(c => c.id) ?? [])
const categoryItems = computed(() => props.categories.map(c => ({ label: c.name, value: c.id })))

const slugTouched = ref(Boolean(props.initial))
watch(() => form.name, (name) => {
  if (!slugTouched.value) form.slug = slugify(name)
})

const variants = ref<VariantRow[]>(
  props.initial?.variants.length
    ? props.initial.variants.map(v => ({
        id: v.id,
        unit: v.unit,
        price: Number(v.price),
        compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : undefined,
        stock: v.stock,
        sku: v.sku ?? '',
        isDefault: v.isDefault,
      }))
    : [{ unit: 'kg', price: undefined, compareAtPrice: undefined, stock: 0, sku: '', isDefault: true }],
)

function addVariant() {
  variants.value.push({ unit: '', price: undefined, compareAtPrice: undefined, stock: 0, sku: '', isDefault: false })
}

function removeVariant(index: number) {
  if (variants.value.length <= 1) return
  const wasDefault = variants.value[index]?.isDefault
  variants.value.splice(index, 1)
  if (wasDefault && variants.value[0]) variants.value[0].isDefault = true
}

function setDefaultVariant(index: number) {
  variants.value.forEach((v, i) => { v.isDefault = i === index })
}

const images = ref<ImageRow[]>(
  props.initial?.images.map(img => ({ id: img.id, url: img.url, alt: img.alt ?? '' })) ?? [],
)

interface DishRow {
  id?: string
  name: string
  imageUrl: string | null
  videoUrl: string
}

const suggestedDishes = ref<DishRow[]>(
  props.initial?.suggestedDishes.map(d => ({ id: d.id, name: d.name, imageUrl: d.imageUrl, videoUrl: d.videoUrl ?? '' })) ?? [],
)

const selectedTagIds = ref<string[]>(props.initial?.tags.map(t => t.id) ?? [])

function toggleTag(id: string) {
  selectedTagIds.value = selectedTagIds.value.includes(id)
    ? selectedTagIds.value.filter(t => t !== id)
    : [...selectedTagIds.value, id]
}

function submit() {
  emit('submit', {
    name: form.name,
    slug: form.slug,
    description: form.description || undefined,
    origin: form.origin || undefined,
    categoryIds: categoryIds.value,
    status: form.status,
    isFeatured: form.isFeatured,
    images: images.value.map((img, idx) => ({ id: img.id, url: img.url, alt: img.alt || undefined, position: idx })),
    tagIds: selectedTagIds.value,
    variants: variants.value.map(v => ({
      id: v.id,
      unit: v.unit,
      price: v.price,
      compareAtPrice: v.compareAtPrice || undefined,
      stock: v.stock,
      sku: v.sku || undefined,
      isDefault: v.isDefault,
    })),
    suggestedDishes: suggestedDishes.value.map((d, idx) => ({
      id: d.id,
      name: d.name,
      imageUrl: d.imageUrl || undefined,
      videoUrl: d.videoUrl || undefined,
      position: idx,
    })),
    availabilityDays: form.availabilityDays ?? null,
    importPrice: form.importPrice ?? null,
  })
}
</script>

<template>
  <div class="space-y-6">
    <UCard>
      <template #header>
        <h2 class="font-semibold text-highlighted">
          Thông tin cơ bản
        </h2>
      </template>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <UFormField label="Tên sản phẩm" required class="sm:col-span-2">
          <UInput v-model="form.name" class="w-full" />
        </UFormField>
        <UFormField label="Slug" required>
          <UInput v-model="form.slug" class="w-full" @input="slugTouched = true" />
        </UFormField>
        <UFormField label="Danh mục" required class="sm:col-span-2">
          <USelectMenu
            v-model="categoryIds"
            multiple
            value-key="value"
            :items="categoryItems"
            placeholder="Chọn danh mục"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Nguồn gốc">
          <UInput v-model="form.origin" placeholder="Vd: Vũng Tàu" class="w-full" />
        </UFormField>
        <UFormField label="Trạng thái">
          <USelect
            v-model="form.status"
            :items="[{ label: 'Đang bán', value: 'ACTIVE' }, { label: 'Ngừng bán', value: 'INACTIVE' }]"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Mô tả" class="sm:col-span-2">
          <UTextarea v-model="form.description" :rows="4" class="w-full" />
        </UFormField>
        <UCheckbox v-model="form.isFeatured" label="Sản phẩm nổi bật" class="sm:col-span-2" />
        <UFormField label="Tag" class="sm:col-span-2">
          <div v-if="tags.length" class="flex flex-wrap gap-2">
            <button
              v-for="tag in tags"
              :key="tag.id"
              type="button"
              class="rounded border px-2.5 py-1 text-xs font-medium transition"
              :style="selectedTagIds.includes(tag.id)
                ? { backgroundColor: tag.color, borderColor: tag.color, color: tagTextColor(tag.color) }
                : { borderColor: tag.color, color: tag.color }"
              @click="toggleTag(tag.id)"
            >
              {{ tag.name }}
            </button>
          </div>
          <p v-else class="text-sm text-muted">
            Chưa có tag nào — tạo tag ở mục "Tag" trong menu quản trị.
          </p>
        </UFormField>
      </div>
    </UCard>

    <AdminImageListUploader v-model="images" :default-alt="form.name" />

    <AdminSuggestedDishManager v-model="suggestedDishes" />

    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-highlighted">
            Biến thể / Đơn vị bán
          </h2>
          <UButton icon="i-lucide-plus" size="sm" variant="outline" @click="addVariant">
            Thêm biến thể
          </UButton>
        </div>
        <p v-if="variants.length > 1" class="mt-1 text-sm text-muted">
          Biến thể "Mặc định" là biến thể dùng để hiển thị giá/đơn vị trên card sản phẩm ở trang chủ, danh mục, tìm kiếm...
        </p>
      </template>
      <div class="space-y-3">
        <div
          v-for="(variant, idx) in variants"
          :key="idx"
          class="grid grid-cols-2 gap-3 rounded-lg border border-default p-3 sm:grid-cols-6"
        >
          <UFormField label="Đơn vị" size="sm">
            <UInput v-model="variant.unit" placeholder="kg, con, hộp..." />
          </UFormField>
          <UFormField label="Giá bán" size="sm">
            <UInputNumber v-model="variant.price" :min="0" />
          </UFormField>
          <UFormField label="Giá gốc" size="sm">
            <UInputNumber v-model="variant.compareAtPrice" :min="0" />
          </UFormField>
          <UFormField label="Tồn kho" size="sm">
            <UInputNumber v-model="variant.stock" :min="0" />
          </UFormField>
          <UFormField label="SKU" size="sm">
            <UInput v-model="variant.sku" />
          </UFormField>
          <div class="flex items-end justify-between gap-2">
            <URadioGroup
              :model-value="variant.isDefault ? idx : undefined"
              :items="[{ label: 'Mặc định', value: idx }]"
              size="sm"
              @update:model-value="setDefaultVariant(idx)"
            />
            <UButton
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              size="sm"
              :disabled="variants.length <= 1"
              @click="removeVariant(idx)"
            />
          </div>
        </div>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="font-semibold text-highlighted">
          Nhập kho
        </h2>
        <p class="text-sm text-muted">
          Thông tin nội bộ — chỉ admin thấy, không hiển thị cho khách.
        </p>
      </template>
      <UFormField label="Giá nhập kho tại cảng">
        <div class="flex items-center gap-2">
          <UInputNumber v-model="form.importPrice" :min="0" :step="1000" class="w-full" />
          <span class="shrink-0 text-sm text-muted">đ</span>
        </div>
      </UFormField>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="font-semibold text-highlighted">
          Ngày dự kiến có hàng
        </h2>
        <p class="text-sm text-muted">
          Tuỳ chọn — để trống nghĩa là "Có sẵn" (mặc định 2 ngày). Dùng để nhóm đợt giao khi khách chọn giao nhiều lần ở checkout.
        </p>
      </template>
      <UFormField label="Số ngày dự kiến có hàng">
        <div class="flex items-center gap-2">
          <span class="shrink-0 text-sm text-muted">~</span>
          <UInputNumber v-model="form.availabilityDays" :min="0" class="w-full" />
          <span class="shrink-0 text-sm text-muted">ngày</span>
        </div>
      </UFormField>
    </UCard>

    <div class="flex justify-end gap-3">
      <UButton color="neutral" variant="outline" :disabled="loading" @click="emit('cancel')">
        Huỷ
      </UButton>
      <UButton :loading="loading" :disabled="loading" @click="submit">
        Lưu sản phẩm
      </UButton>
    </div>
  </div>
</template>
