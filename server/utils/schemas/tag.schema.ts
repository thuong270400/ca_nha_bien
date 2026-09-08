import { z } from 'zod'
import { slugSchema } from './common.schema'

export const tagCreateSchema = z.object({
  name: z.string().trim().min(1, 'Tên tag không được để trống').max(60),
  slug: slugSchema,
})

export const tagUpdateSchema = tagCreateSchema.partial()

export type TagCreateInput = z.infer<typeof tagCreateSchema>
export type TagUpdateInput = z.infer<typeof tagUpdateSchema>
