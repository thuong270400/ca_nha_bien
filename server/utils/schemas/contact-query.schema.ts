import { z } from 'zod'
import { boolQuery, paginationSchema } from './common.schema'

export const contactListQuerySchema = paginationSchema.extend({
  isRead: boolQuery.optional(),
})
