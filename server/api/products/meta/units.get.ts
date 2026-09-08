import { z } from 'zod'
import { getDistinctUnits } from '../../../services/product.service'

const querySchema = z.object({ category: z.string().trim().optional() })

export default defineApiHandler(async (event) => {
  const { category } = await getValidatedQuery(event, querySchema.parse)
  return getDistinctUnits(category)
})
