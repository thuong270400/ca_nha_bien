import { suggestProducts } from '../../../services/product.service'
import { productSuggestQuerySchema } from '../../../utils/schemas/product.schema'

export default defineApiHandler(async (event) => {
  const { q } = await getValidatedQuery(event, productSuggestQuerySchema.parse)
  return suggestProducts(q)
})
