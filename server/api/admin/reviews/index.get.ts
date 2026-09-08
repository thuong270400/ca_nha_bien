import { listReviewsForAdmin } from '../../../services/review.service'
import { adminReviewListQuerySchema } from '../../../utils/schemas/review.schema'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const query = await getValidatedQuery(event, adminReviewListQuerySchema.parse)
  return listReviewsForAdmin(query)
})
