<script setup lang="ts">
import type { Category, PaginatedResult, Product, Tag } from '#shared/types/catalog'

const route = useRoute()
const router = useRouter()

const { data: categories } = await useFetch<Category[]>('/api/categories', {
  query: { activeOnly: true },
  key: 'nav-categories',
})

const { data: units } = await useFetch<string[]>('/api/products/meta/units', {
  query: computed(() => ({ category: (route.query.category as string) || undefined })),
  key: 'product-units',
})

const { data: tags } = await useFetch<Tag[]>('/api/tags', { key: 'product-tags' })

const sortOptions = [
  { label: 'Mới nhất', value: 'newest' },
  { label: 'Bán chạy', value: 'best_selling' },
  { label: 'Giá tăng dần', value: 'price_asc' },
  { label: 'Giá giảm dần', value: 'price_desc' },
  { label: 'Tên A-Z', value: 'name_asc' },
]

const listQuery = computed(() => ({
  q: (route.query.q as string) || undefined,
  category: (route.query.category as string) || undefined,
  unit: (route.query.unit as string) || undefined,
  tags: (route.query.tags as string) || undefined,
  minPrice: (route.query.minPrice as string) || undefined,
  maxPrice: (route.query.maxPrice as string) || undefined,
  inStock: (route.query.inStock as string) || undefined,
  sort: (route.query.sort as string) || 'newest',
  page: route.query.page ? Number(route.query.page) : 1,
  limit: 12,
}))

const { data, status } = await useFetch<PaginatedResult<Product>>('/api/products', {
  query: listQuery,
  key: 'products-list',
})

const searchInput = ref((route.query.q as string) || '')
const minPriceInput = ref<number | undefined>(route.query.minPrice ? Number(route.query.minPrice) : undefined)
const maxPriceInput = ref<number | undefined>(route.query.maxPrice ? Number(route.query.maxPrice) : undefined)

watch(() => route.query.q, (q) => { searchInput.value = (q as string) || '' })

function setQuery(patch: Record<string, string | number | undefined>) {
  const next: Record<string, string> = {}
  for (const [key, value] of Object.entries({ ...route.query, ...patch })) {
    if (value !== undefined && value !== null && value !== '') next[key] = String(value)
  }
  if (!('page' in patch)) delete next.page
  router.push({ path: '/products', query: next })
}

function submitSearch() {
  setQuery({ q: searchInput.value.trim() || undefined })
}

function applyPriceRange() {
  setQuery({ minPrice: minPriceInput.value, maxPrice: maxPriceInput.value })
}

function toggleCategory(slug: string) {
  setQuery({ category: route.query.category === slug ? undefined : slug })
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

const activeCategory = computed(() => categories.value?.find(c => c.slug === route.query.category))

useSeoMeta({
  title: computed(() => activeCategory.value ? `${activeCategory.value.name} - Cá Nhà Biển` : 'Tất cả sản phẩm - Cá Nhà Biển'),
  description: 'Danh sách cá tươi, hải sản tươi sống tại Cá Nhà Biển. Lọc theo loại cá, giá, tình trạng còn hàng.',
})

useCanonical(activeCategory.value ? `/products?category=${activeCategory.value.slug}` : '/products')
</script>

<template>
  <UContainer class="py-8">
    <UBreadcrumb
      class="mb-6"
      :items="activeCategory
        ? [{ label: 'Trang chủ', to: '/' }, { label: 'Sản phẩm', to: '/products' }, { label: activeCategory.name }]
        : [{ label: 'Trang chủ', to: '/' }, { label: 'Sản phẩm' }]"
    />

    <div class="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
      <aside class="space-y-4">
        <UCard :ui="{ body: 'p-4 sm:p-4' }">
          <h3 class="mb-3 text-sm font-semibold text-highlighted">
            Danh mục
          </h3>
          <ul class="space-y-1">
            <li v-for="category in categories ?? []" :key="category.id">
              <button
                type="button"
                class="w-full rounded-md px-2 py-1.5 text-left text-sm transition"
                :class="route.query.category === category.slug
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'text-muted hover:bg-elevated'"
                @click="toggleCategory(category.slug)"
              >
                {{ category.name }}
              </button>
            </li>
          </ul>
        </UCard>

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
        <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <form class="flex w-full max-w-sm gap-2" @submit.prevent="submitSearch">
            <UInput v-model="searchInput" icon="i-lucide-search" placeholder="Tìm cá, hải sản..." class="w-full" />
          </form>
          <USelect
            :model-value="listQuery.sort"
            :items="sortOptions"
            class="w-full sm:w-48"
            @update:model-value="setSort"
          />
        </div>

        <div v-if="tags?.length" class="mb-4 flex flex-wrap gap-2">
          <button
            v-for="tag in tags"
            :key="tag.id"
            type="button"
            class="rounded border px-3 py-1 text-xs font-medium transition"
            :style="selectedTags.includes(tag.slug)
              ? { backgroundColor: tag.color, borderColor: tag.color, color: tagTextColor(tag.color) }
              : { borderColor: tag.color, color: tag.color }"
            @click="toggleTag(tag.slug)"
          >
            {{ tag.name }}
          </button>
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

        <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StorefrontProductCard v-for="(product, index) in data.data" :key="product.id" :product="product" :index="index" />
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
