import { z } from 'zod'
import { slugSchema } from './common.schema'
import { productImageSchema, productStatusSchema } from './product.schema'

export const comboItemSchema = z.object({
  variantId: z.string().trim().min(1),
  quantity: z.coerce.number().int().min(1, 'Số lượng tối thiểu là 1').max(999).default(1),
})

export const comboCreateSchema = z.object({
  name: z.string().trim().min(1, 'Tên combo không được để trống').max(200),
  slug: slugSchema,
  description: z.string().trim().max(5000).optional(),
  status: productStatusSchema.optional(),
  isFeatured: z.boolean().optional(),
  images: z.array(productImageSchema).optional(),
  items: z.array(comboItemSchema).min(1, 'Combo cần ít nhất 1 sản phẩm'),
  /** Số tiền giảm so với tổng giá gốc các sản phẩm — giá bán = tổng - discount. */
  discount: z.coerce.number().min(0, 'Số tiền giảm không được âm').default(0),
})

export const comboUpdateSchema = comboCreateSchema.partial()

export type ComboCreateInput = z.infer<typeof comboCreateSchema>
export type ComboUpdateInput = z.infer<typeof comboUpdateSchema>
