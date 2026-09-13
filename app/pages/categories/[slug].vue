<script setup lang="ts">
import type { Category, PaginatedResult, Product, Tag } from '#shared/types/catalog'

const route = useRoute()
const router = useRouter()
const slug = route.params.slug as string

const { data: category } = await useFetch<Category>(`/api/categories/slug/${slug}`, {
  key: `category-${slug}`,
})

if (!category.value) {
  throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy danh mục', fatal: true })
}

const sortOptions = [
  { label: 'Mới nhất', value: 'newest' },
  { label: 'Cũ nhất', value: 'oldest' },
  { label: 'Bán chạy', value: 'best_selling' },
  { label: 'Giá tăng dần', value: 'price_asc' },
  { label: 'Giá giảm dần', value: 'price_desc' },
  { label: 'Tên A-Z', value: 'name_asc' },
  { label: 'Tồn kho nhiều nhất', value: 'stock_desc' },
  { label: 'Tồn kho ít nhất', value: 'stock_asc' },
]

const listQuery = computed(() => ({
  category: slug,
  unit: (route.query.unit as string) || undefined,
  tags: (route.query.tags as string) || undefined,
  minPrice: (route.query.minPrice as string) || undefined,
  maxPrice: (route.query.maxPrice as string) || undefined,
  inStock: (route.query.inStock as string) || undefined,
  sort: (route.query.sort as string) || category.value?.defaultSort || 'newest',
  page: route.query.page ? Number(route.query.page) : 1,
  limit: 12,
}))

const { data, status } = await useFetch<PaginatedResult<Product>>('/api/products', {
  query: listQuery,
  key: `category-products-${slug}`,
})

const { data: units } = await useFetch<string[]>('/api/products/meta/units', {
  query: { category: slug },
  key: `category-units-${slug}`,
})

const { data: tags } = await useFetch<Tag[]>('/api/tags', { key: 'product-tags' })

const minPriceInput = ref<number | undefined>(route.query.minPrice ? Number(route.query.minPrice) : undefined)
const maxPriceInput = ref<number | undefined>(route.query.maxPrice ? Number(route.query.maxPrice) : undefined)

function setQuery(patch: Record<string, string | number | undefined>) {
  const next: Record<string, string> = {}
  for (const [key, value] of Object.entries({ ...route.query, ...patch })) {
    if (value !== undefined && value !== null && value !== '') next[key] = String(value)
  }
  if (!('page' in patch)) delete next.page
  router.push({ path: `/categories/${slug}`, query: next })
}

function applyPriceRange() {
  setQuery({ minPrice: minPriceInput.value, maxPrice: maxPriceInput.value })
}

function toggleListValue(key: 'unit' | 'tags', current: string[], value: string) {
  const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value]
  setQuery({ [key]: next.length ? next.join(',') : undefined })
}

const selectedUnits = computed(() => (route.query.unit as string)?.split(',').filter(Boolean) ?? [])
const selectedTags = computed(() => (route.query.tags as string)?.split(',').filter(Boolean) ?? [])

function toggleUnit(unit: string) {
  toggleListValue('unit', selectedUnits.value, unit)
}

function toggleTag(slug: string) {
  toggleListValue('tags', selectedTags.value, slug)
}

function toggleInStock(value: boolean | 'indeterminate') {
  setQuery({ inStock: value === true ? 'true' : undefined })
}

function setSort(value: string | number | undefined) {
  setQuery({ sort: value as string })
}

function setPage(page: number) {
  setQuery({ page })
}

useSeoMeta({
  title: () => `${category.value?.name} - Cá Nhà Biển`,
  description: () => category.value?.description || `Danh sách sản phẩm thuộc danh mục ${category.value?.name} tại Cá Nhà Biển.`,
})

useCanonical(`/categories/${slug}`)
</script>

<template>
  <UContainer v-if="category" class="py-8">
    <UBreadcrumb
      class="mb-6"
      :items="[
        { label: 'Trang chủ', to: '/' },
        { label: 'Sản phẩm', to: '/products' },
        { label: category.name },
      ]"
    />

    <div class="mb-6 overflow-hidden rounded-xl border border-default">
      <div v-if="category.imageUrl" class="h-40 w-full overflow-hidden bg-elevated">
        <img :src="category.imageUrl" :alt="category.name" class="size-full object-cover">
      </div>
      <div class="p-5">
        <h1 class="text-2xl font-bold text-highlighted">
          {{ category.name }}
        </h1>
        <p v-if="category.description" class="mt-1 text-sm text-muted">
          {{ category.description }}
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
      <aside class="space-y-4">
        <UCard v-if="units?.length" :ui="{ body: 'p-4 sm:p-4' }">
          <h3 class="mb-3 text-sm font-semibold text-highlighted">
            Đơn vị/Trọng lượng
          </h3>
          <ul class="space-y-1.5">
            <li v-for="unit in units" :key="unit">
              <UCheckbox
                :model-value="selectedUnits.includes(unit)"
                :label="unit"
                @update:model-value="toggleUnit(unit)"
              />
            </li>
          </ul>
        </UCard>

        <UCard :ui="{ body: 'p-4 sm:p-4' }">
          <h3 class="mb-3 text-sm font-semibold text-highlighted">
            Khoảng giá
          </h3>
          <div class="flex items-center gap-2">
            <UInputNumber v-model="minPriceInput" placeholder="Từ" :min="0" size="sm" />
            <span class="text-muted">-</span>
            <UInputNumber v-model="maxPriceInput" placeholder="Đến" :min="0" size="sm" />
          </div>
          <UButton class="mt-2" size="sm" variant="outline" block @click="applyPriceRange">
            Áp dụng
          </UButton>
        </UCard>

        <div>
          <UCheckbox
            :model-value="route.query.inStock === 'true'"
            label="Chỉ hiện còn hàng"
            @update:model-value="toggleInStock"
          />
        </div>
      </aside>

      <div>
        <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <USelect
            :model-value="listQuery.sort"
            :items="sortOptions"
            class="w-full sm:w-48"
            @update:model-value="setSort"
          />
        </div>

        <div v-if="tags?.length" class="mb-4 flex flex-wrap gap-2">
          <UButton
            v-for="tag in tags"
            :key="tag.id"
            size="xs"
            :variant="selectedTags.includes(tag.slug) ? 'solid' : 'outline'"
            :color="selectedTags.includes(tag.slug) ? 'primary' : 'neutral'"
            class="rounded-full"
            @click="toggleTag(tag.slug)"
          >
            {{ tag.name }}
          </UButton>
        </div>

        <p class="mb-4 text-sm text-muted">
          {{ data?.meta.total ?? 0 }} sản phẩm
        </p>

        <div v-if="status === 'pending'" class="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div v-for="i in 6" :key="i" class="aspect-square animate-pulse rounded-xl bg-elevated" />
        </div>

        <div v-else-if="!data?.data.length" class="rounded-xl border border-dashed border-default py-16 text-center">
          <p class="text-muted">
            Không tìm thấy sản phẩm phù hợp.
          </p>
        </div>

        <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StorefrontProductCard v-for="product in data.data" :key="product.id" :product="product" />
        </div>

        <div v-if="data && data.meta.totalPages > 1" class="mt-8 flex justify-center">
          <UPagination
            :page="data.meta.page"
            :total="data.meta.total"
            :items-per-page="data.meta.limit"
            @update:page="setPage"
          />
        </div>
      </div>
    </div>
  </UContainer>
</template>
