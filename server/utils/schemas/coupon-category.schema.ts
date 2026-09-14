import { z } from 'zod'
import { boolQuery, slugSchema } from './common.schema'

export const couponCategoryCreateSchema = z.object({
  name: z.string().trim().min(1, 'Tên danh mục không được để trống').max(120),
  slug: slugSchema,
  isActive: z.boolean().optional(),
  position: z.number().int().optional(),
})

export const couponCategoryUpdateSchema = couponCategoryCreateSchema.partial()

export const couponCategoryListQuerySchema = z.object({
  activeOnly: boolQuery.optional(),
})

export type CouponCategoryCreateInput = z.infer<typeof couponCategoryCreateSchema>
export type CouponCategoryUpdateInput = z.infer<typeof couponCategoryUpdateSchema>
