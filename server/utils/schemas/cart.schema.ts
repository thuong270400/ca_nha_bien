import { z } from 'zod'

export const cartAddItemSchema = z.object({
  variantId: z.string().trim().min(1, 'Vui lòng chọn biến thể sản phẩm'),
  quantity: z.coerce.number().int().min(1, 'Số lượng tối thiểu là 1').max(99),
})

export const cartUpdateItemSchema = z.object({
  quantity: z.coerce.number().int().min(1, 'Số lượng tối thiểu là 1').max(99),
})

export type CartAddItemInput = z.infer<typeof cartAddItemSchema>
export type CartUpdateItemInput = z.infer<typeof cartUpdateItemSchema>
