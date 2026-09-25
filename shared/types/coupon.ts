export type CouponType = 'PERCENTAGE' | 'FIXED'

export interface CouponCategoryView {
  id: string
  name: string
  slug: string
  isActive: boolean
  position: number
}

export interface CouponView {
  id: string
  code: string
  type: CouponType
  value: string
  minOrderValue: string | null
  maxDiscount: string | null
  usageLimit: number | null
  usedCount: number
  startsAt: string | null
  expiresAt: string | null
  isActive: boolean
  showOnHomepage: boolean
  createdAt: string
  categoryId: string
  category: CouponCategoryView
}

/** Storefront-facing shape for the checkout "view coupons" picker — no internal usage stats. */
export interface CouponPublicView {
  code: string
  type: CouponType
  value: string
  minOrderValue: string | null
  maxDiscount: string | null
  expiresAt: string | null
  categoryId: string
  categoryName: string
  /** Whether the current cart subtotal meets minOrderValue. */
  eligible: boolean
  /** Discount this coupon would apply right now (0 when not eligible). */
  discountAmount: string
  /** How much more the customer needs to add to the cart to become eligible (0 when already eligible). */
  missingAmount: string
}

/** Landing-page promo ticket shape — not tied to a cart, so no eligibility/discount fields. */
export interface CouponPromoView {
  code: string
  type: CouponType
  value: string
  minOrderValue: string | null
  maxDiscount: string | null
  usageLimit: number | null
  categoryId: string
  categoryName: string
}
