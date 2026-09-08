import { z } from 'zod'
import { listCustomers } from '../../../services/customer.service'
import { paginationSchema } from '../../../utils/schemas/common.schema'

const querySchema = paginationSchema.extend({ q: z.string().trim().max(200).optional() })

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const query = await getValidatedQuery(event, querySchema.parse)
  return listCustomers(query)
})
