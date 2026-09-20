<script setup lang="ts">
import type { Category, Product, SourcingClassification, Tag } from '#shared/types/catalog'

const props = defineProps<{
  categories: Category[]
  tags: Tag[]
  sourcingClassifications: SourcingClassification[]
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

interface ImageRow {
  id?: string
  url: string
  alt: string
}

const form = reactive({
  name: props.initial?.name ?? '',
  slug: props.initial?.slug ?? '',
  description: props.initial?.description ?? '',
  origin: props.initial?.origin ?? '',
  status: props.initial?.status ?? 'ACTIVE',
  isFeatured: props.initial?.isFeatured ?? false,
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
const uploading = ref(false)
const toast = useToast()

async function uploadFiles(files: File[]) {
  const imageFiles = files.filter(f => f.type.startsWith('image/'))
  if (!imageFiles.length) return
  uploading.value = true
  try {
    for (const file of imageFiles) {
      const body = new FormData()
      body.append('file', file)
      const res = await $fetch<{ url: string }>('/api/admin/uploads', { method: 'POST', body })
      images.value.push({ url: res.url, alt: form.name })
    }
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Tải ảnh thất bại'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    uploading.value = false
  }
}

async function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const files = input.files ? Array.from(input.files) : []
  await uploadFiles(files)
  input.value = ''
}

const dragCounter = ref(0)
const isDraggingOver = computed(() => dragCounter.value > 0)

function onDragEnter(e: DragEvent) {
  if (!e.dataTransfer?.types.includes('Files')) return
  dragCounter.value++
}

function onDragLeave() {
  dragCounter.value = Math.max(0, dragCounter.value - 1)
}

function onDrop(e: DragEvent) {
  dragCounter.value = 0
  const files = e.dataTransfer?.files ? Array.from(e.dataTransfer.files) : []
  uploadFiles(files)
}

function removeImage(index: number) {
  const [image] = images.value.splice(index, 1)
  // Already-saved images (have an id) are cleaned up server-side on Save instead —
  // removing them here too would delete a still-live product image if the admin
  // navigates away without saving.
  if (image && !image.id) deleteUploadedImage(image.url)
}

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

const sourcingClassificationId = ref<string | undefined>(props.initial?.sourcingClassificationId ?? undefined)

function toggleSourcingClassification(id: string) {
  sourcingClassificationId.value = sourcingClassificationId.value === id ? undefined : id
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
    sourcingClassificationId: sourcingClassificationId.value ?? null,
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

    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-highlighted">
            Hình ảnh
          </h2>
          <label class="cursor-pointer">
            <UButton
              :loading="uploading"
              icon="i-lucide-upload"
              size="sm"
              variant="outline"
              as="span"
            >
              Tải ảnh lên
            </UButton>
            <input type="file" accept="image/*" multiple class="hidden" @change="onFileSelected">
          </label>
        </div>
      </template>
      <div
        class="rounded-lg border-2 border-dashed p-4 transition-colors"
        :class="isDraggingOver ? 'border-primary bg-primary/5' : 'border-transparent'"
        @dragenter.prevent="onDragEnter"
        @dragover.prevent
        @dragleave.prevent="onDragLeave"
        @drop.prevent="onDrop"
      >
        <div v-if="!images.length" class="py-6 text-center text-sm text-muted">
          Kéo thả ảnh vào đây, hoặc bấm "Tải ảnh lên"
        </div>
        <div v-else class="grid grid-cols-3 gap-3 sm:grid-cols-5">
          <div v-for="(image, idx) in images" :key="idx" class="group relative aspect-square overflow-hidden rounded-lg border border-default">
            <img :src="image.url" :alt="image.alt" class="size-full object-cover">
            <button
              type="button"
              class="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
              @click="removeImage(idx)"
            >
              <UIcon name="i-lucide-x" class="size-3" />
            </button>
          </div>
        </div>
      </div>
    </UCard>

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
            <URadio
              :model-value="variant.isDefault"
              :value="true"
              label="Mặc định"
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
          Phân loại nguồn cá
        </h2>
        <p class="text-sm text-muted">
          Tuỳ chọn — mỗi sản phẩm chọn tối đa 1 phân loại. Quản lý danh sách phân loại (thời gian dự kiến có cá/giao hàng...) ở trang Danh mục, tab "Phân loại nguồn cá".
        </p>
      </template>
      <div v-if="sourcingClassifications.length" class="flex flex-wrap gap-2">
        <button
          v-for="item in sourcingClassifications"
          :key="item.id"
          type="button"
          class="rounded border px-2.5 py-1 text-xs font-medium transition"
          :class="sourcingClassificationId === item.id
            ? 'border-primary bg-primary text-inverted'
            : 'border-default text-muted hover:border-primary/50'"
          @click="toggleSourcingClassification(item.id)"
        >
          {{ item.name }}
        </button>
      </div>
      <p v-else class="text-sm text-muted">
        Chưa có phân loại nào — tạo ở trang Danh mục, tab "Phân loại nguồn cá".
      </p>
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
