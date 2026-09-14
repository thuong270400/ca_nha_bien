import { z } from 'zod'

export const createOrderSchema = z.object({
  recipientName: z.string().trim().min(1, 'Vui lòng nhập họ tên').max(120),
  recipientPhone: z.string().trim().regex(/^0\d{9,10}$/, 'Số điện thoại không hợp lệ'),
  province: z.string().trim().min(1, 'Vui lòng nhập tỉnh/thành phố').max(120),
  district: z.string().trim().min(1, 'Vui lòng nhập quận/huyện').max(120),
  ward: z.string().trim().min(1, 'Vui lòng nhập phường/xã').max(120),
  addressLine: z.string().trim().min(1, 'Vui lòng nhập địa chỉ chi tiết').max(300),
  note: z.string().trim().max(500).optional(),
  addressId: z.string().trim().optional(),
  saveAddress: z.boolean().optional(),
  // At most 1 coupon per CouponCategory is allowed (enforced server-side in order.service.ts),
  // so this can hold several codes at once as long as each comes from a different category.
  couponCodes: z.array(z.string().trim().min(1).max(30)).max(20).optional(),
  // Only COD is wired up today; the schema/enum already support VNPAY/MOMO/ZALOPAY for later.
  paymentMethod: z.literal('COD').default('COD'),
})

export const orderStatusUpdateSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'CANCELLED']),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>
