import { z } from 'zod'

/** Query params arrive as strings; z.coerce.boolean() would treat "false" as truthy. */
export const boolQuery = z.preprocess(
  (v) => (typeof v === 'string' ? v === 'true' : v),
  z.boolean(),
)

export const slugSchema = z
  .string()
  .trim()
  .min(1, 'Slug không được để trống')
  .max(220)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug chỉ gồm chữ thường, số và dấu gạch ngang')

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
