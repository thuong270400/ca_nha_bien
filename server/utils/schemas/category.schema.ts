import { z } from 'zod'
import { boolQuery, slugSchema } from './common.schema'

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1, 'Tên danh mục không được để trống').max(120),
  slug: slugSchema,
  description: z.string().trim().max(2000).optional(),
  imageUrl: z.string().trim().max(1000).optional(),
  isActive: z.boolean().optional(),
  position: z.number().int().optional(),
})

export const categoryUpdateSchema = categoryCreateSchema.partial()

export const categoryListQuerySchema = z.object({
  activeOnly: boolQuery.optional(),
})

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>
