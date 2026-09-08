import type { Product } from './catalog'

export interface WishlistItemView {
  id: string
  productId: string
  createdAt: string
  product: Product
}
