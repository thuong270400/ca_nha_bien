import { z } from 'zod'

export const addressSchema = z.object({
  fullName: z.string().trim().min(1, 'Vui lòng nhập họ tên').max(120),
  phone: z.string().trim().regex(/^0\d{9,10}$/, 'Số điện thoại không hợp lệ'),
  province: z.string().trim().min(1, 'Vui lòng nhập tỉnh/thành phố').max(120),
  district: z.string().trim().min(1, 'Vui lòng nhập quận/huyện').max(120),
  ward: z.string().trim().min(1, 'Vui lòng nhập phường/xã').max(120),
  addressLine: z.string().trim().min(1, 'Vui lòng nhập địa chỉ chi tiết').max(300),
  note: z.string().trim().max(500).optional(),
  isDefault: z.boolean().optional(),
})

export type AddressInput = z.infer<typeof addressSchema>
