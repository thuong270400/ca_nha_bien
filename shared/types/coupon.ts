export type CouponType = 'PERCENTAGE' | 'FIXED'

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
  createdAt: string
}
