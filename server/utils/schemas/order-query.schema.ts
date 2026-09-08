import { z } from 'zod'
import { paginationSchema } from './common.schema'

export const orderListQuerySchema = paginationSchema.extend({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'CANCELLED']).optional(),
})
