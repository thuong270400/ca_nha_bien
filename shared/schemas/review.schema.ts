import { z } from 'zod'

export const reviewCreateSchema = z.object({
  productId: z.string().trim().min(1),
  rating: z.coerce.number().int().min(1, 'Vui lòng chọn số sao').max(5, 'Số sao tối đa là 5'),
  comment: z.string().trim().max(1000).optional(),
})

export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>
