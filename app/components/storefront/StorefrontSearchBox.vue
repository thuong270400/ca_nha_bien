<script setup lang="ts">
import type { ProductSuggestion } from '#shared/types/catalog'

const { placeholder = 'Tìm cá, hải sản...', size = 'sm' } = defineProps<{
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
}>()

const router = useRouter()
const search = ref('')
const suggestions = ref<ProductSuggestion[]>([])
const open = ref(false)
const loading = ref(false)
const boxRef = ref<HTMLElement | null>(null)

const fetchSuggestions = useDebounceFn(async (q: string) => {
  if (q.trim().length < 2) {
    suggestions.value = []
    return
  }
  loading.value = true
  try {
    suggestions.value = await $fetch<ProductSuggestion[]>('/api/products/search/suggest', { query: { q } })
  } catch {
    suggestions.value = []
  } finally {
    loading.value = false
  }
}, 300)

watch(search, (q) => {
  open.value = true
  fetchSuggestions(q)
})

onClickOutside(boxRef, () => { open.value = false })

function selectSuggestion(product: ProductSuggestion) {
  open.value = false
  search.value = ''
  router.push(`/products/${product.slug}`)
}

function submitSearch() {
  open.value = false
  const q = search.value.trim()
  router.push({ path: '/products', query: q ? { q } : {} })
}
</script>

<template>
  <div ref="boxRef" class="relative w-full">
    <form @submit.prevent="submitSearch">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        :placeholder="placeholder"
        :size="size"
        class="w-full"
        @focus="open = true"
      />
    </form>

    <div
      v-if="open && (suggestions.length || loading)"
      class="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-default bg-default shadow-lg"
    >
      <div v-if="loading" class="p-3 text-center text-sm text-muted">
        Đang tìm...
      </div>
      <button
        v-for="product in suggestions"
        :key="product.id"
        type="button"
        class="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-elevated"
        @click="selectSuggestion(product)"
      >
        <img
          :src="product.imageUrl ?? '/images/placeholder-fish.svg'"
          :alt="product.name"
          class="size-10 shrink-0 rounded-md object-cover"
        >
        <span class="min-w-0 flex-1">
          <span class="block truncate text-sm font-medium text-highlighted">{{ product.name }}</span>
          <span class="block text-xs text-primary">{{ formatVnd(product.price) }}</span>
        </span>
      </button>
    </div>
  </div>
</template>
