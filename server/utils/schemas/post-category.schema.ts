import { z } from 'zod'
import { boolQuery, slugSchema } from './common.schema'

export const postCategoryCreateSchema = z.object({
  name: z.string().trim().min(1, 'Tên danh mục không được để trống').max(120),
  slug: slugSchema,
  description: z.string().trim().max(500).nullish(),
  imageUrl: z.string().trim().max(1000).nullish(),
  isActive: z.boolean().optional(),
  position: z.number().int().optional(),
})

export const postCategoryUpdateSchema = postCategoryCreateSchema.partial()

export const postCategoryListQuerySchema = z.object({
  activeOnly: boolQuery.optional(),
})

export type PostCategoryCreateInput = z.infer<typeof postCategoryCreateSchema>
export type PostCategoryUpdateInput = z.infer<typeof postCategoryUpdateSchema>
