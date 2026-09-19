import type { SuggestedDishVideoType } from '../utils/video'

export type CategoryDefaultSort = 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'name_asc' | 'stock_asc' | 'stock_desc'

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  isActive: boolean
  isFeatured: boolean
  homepageLimit: number | null
  position: number
  defaultSort: CategoryDefaultSort
}

export interface CategoryHomeSection extends Category {
  products: Product[]
  hasMore: boolean
}

export interface ProductVariant {
  id: string
  productId: string
  unit: string
  price: string
  compareAtPrice: string | null
  stock: number
  sku: string | null
  isDefault: boolean
}

export interface ProductSourcingOption {
  id: string
  productId: string
  label: string
  catchProcess: string | null
  expectedAvailability: string | null
  expectedAvailabilityDays: number | null
  depositPercent: number | null
  position: number
}

export interface ProductImage {
  id: string
  productId: string
  url: string
  alt: string | null
  position: number
}

export type ProductStatus = 'ACTIVE' | 'INACTIVE'

export interface SuggestedDish {
  id: string
  productId: string
  name: string
  imageUrl: string | null
  videoUrl: string | null
  videoType: SuggestedDishVideoType | null
  position: number
}

export interface Tag {
  id: string
  name: string
  slug: string
  color: string
  showOnImage: boolean
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  origin: string | null
  status: ProductStatus
  deletedAt: string | null
  isFeatured: boolean
  price: string | null
  compareAtPrice: string | null
  stock: number
  soldCount: number
  avgRating: number
  reviewCount: number
  categories: Category[]
  images: ProductImage[]
  variants: ProductVariant[]
  tags: Tag[]
  suggestedDishes: SuggestedDish[]
  sourcingOptions: ProductSourcingOption[]
}

export interface ProductDetail extends Product {
  related: Product[]
}

export interface ProductSuggestion {
  id: string
  name: string
  slug: string
  price: string | null
  imageUrl: string | null
}

export interface PaginatedResult<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
