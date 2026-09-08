import { z } from 'zod'
import { boolQuery, paginationSchema } from './common.schema'

export const reviewListQuerySchema = paginationSchema.extend({
  productId: z.string().trim().min(1),
})

export const adminReviewListQuerySchema = paginationSchema.extend({
  productId: z.string().trim().optional(),
  isHidden: boolQuery.optional(),
})

export const reviewModerateSchema = z.object({
  isHidden: z.boolean(),
})

export const reviewEligibilityQuerySchema = z.object({
  productId: z.string().trim().min(1),
})

export type ReviewListQuery = z.infer<typeof reviewListQuerySchema>
export type AdminReviewListQuery = z.infer<typeof adminReviewListQuerySchema>
