import { z } from 'zod'
import { boolQuery, paginationSchema, slugSchema } from './common.schema'

export const postTypeSchema = z.enum(['NEWS', 'RECIPE'])

export const postCreateSchema = z.object({
  title: z.string().trim().min(1, 'Tiêu đề không được để trống').max(200),
  slug: slugSchema,
  excerpt: z.string().trim().max(500).optional(),
  content: z.string().trim().min(1, 'Nội dung không được để trống'),
  coverImageUrl: z.string().trim().max(1000).optional(),
  type: postTypeSchema,
  isPublished: z.boolean().optional(),
})

export const postUpdateSchema = postCreateSchema.partial()

export const postListQuerySchema = paginationSchema.extend({
  type: postTypeSchema.optional(),
})

export const postAdminListQuerySchema = postListQuerySchema.extend({
  isPublished: boolQuery.optional(),
})

export type PostCreateInput = z.infer<typeof postCreateSchema>
export type PostUpdateInput = z.infer<typeof postUpdateSchema>
