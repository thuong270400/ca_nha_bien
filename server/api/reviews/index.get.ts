import { listReviewsForProduct } from '../../services/review.service'
import { reviewListQuerySchema } from '../../utils/schemas/review.schema'

export default defineApiHandler(async (event) => {
  const query = await getValidatedQuery(event, reviewListQuerySchema.parse)
  return listReviewsForProduct(query.productId, { page: query.page, limit: query.limit })
})
