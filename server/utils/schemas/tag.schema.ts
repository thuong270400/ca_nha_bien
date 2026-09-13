import { z } from 'zod'
import { slugSchema } from './common.schema'

const hexColorSchema = z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/, 'Mã màu không hợp lệ (dạng #RRGGBB)')

export const tagCreateSchema = z.object({
  name: z.string().trim().min(1, 'Tên tag không được để trống').max(60),
  slug: slugSchema,
  color: hexColorSchema.optional(),
  showOnImage: z.boolean().optional(),
})

export const tagUpdateSchema = tagCreateSchema.partial()

export type TagCreateInput = z.infer<typeof tagCreateSchema>
export type TagUpdateInput = z.infer<typeof tagUpdateSchema>
