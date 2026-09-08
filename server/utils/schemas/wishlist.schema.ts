import { z } from 'zod'

export const wishlistAddSchema = z.object({
  productId: z.string().trim().min(1),
})
