export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  isActive: boolean
  position: number
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

export interface ProductImage {
  id: string
  productId: string
  url: string
  alt: string | null
  position: number
}

export type ProductStatus = 'ACTIVE' | 'INACTIVE'

export interface Tag {
  id: string
  name: string
  slug: string
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
  soldCount: number
  avgRating: number
  reviewCount: number
  categories: Category[]
  images: ProductImage[]
  variants: ProductVariant[]
  tags: Tag[]
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
