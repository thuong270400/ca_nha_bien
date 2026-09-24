import { z } from 'zod'
import { boolQuery, paginationSchema, slugSchema } from './common.schema'

export const postTypeSchema = z.enum(['NEWS', 'RECIPE'])

export const postCreateSchema = z.object({
  title: z.string().trim().min(1, 'Tiêu đề không được để trống').max(200),
  slug: slugSchema,
  // null = explicitly cleared in the form (undefined would leave the stored value untouched on PATCH)
  excerpt: z.string().trim().max(500).nullish(),
  // HTML from the admin rich-text editor — sanitized in post.service.ts before it's stored
  content: z.string().trim().min(1, 'Nội dung không được để trống').max(200_000),
  coverImageUrl: z.string().trim().max(1000).nullish(),
  type: postTypeSchema,
  // null = no category (the post still shows on /blog or /recipes, just not under a Góc Biển category)
  categoryId: z.string().trim().min(1).nullish(),
  isPublished: z.boolean().optional(),
})

export const postUpdateSchema = postCreateSchema.partial()

export const postListQuerySchema = paginationSchema.extend({
  type: postTypeSchema.optional(),
  /** PostCategory slug — the storefront's /goc-bien/[slug] page */
  category: slugSchema.optional(),
  q: z.string().trim().max(200).optional(),
})

export const postAdminListQuerySchema = postListQuerySchema.extend({
  isPublished: boolQuery.optional(),
  categoryId: z.string().trim().min(1).optional(),
})

export type PostCreateInput = z.infer<typeof postCreateSchema>
export type PostUpdateInput = z.infer<typeof postUpdateSchema>
export type PostListQuery = z.infer<typeof postListQuerySchema>
export type PostAdminListQuery = z.infer<typeof postAdminListQuerySchema>
