export interface CartItemView {
  id: string
  productId: string
  variantId: string
  quantity: number
  unit: string
  price: string
  lineTotal: string
  stock: number
  available: boolean
  availabilityFromDays: number
  availabilityToDays: number
  product: {
    id: string
    name: string
    slug: string
    image: string | null
  }
}

export interface CartView {
  id: string
  items: CartItemView[]
  itemCount: number
  subtotal: string
  shippingFee: string
  total: string
}
