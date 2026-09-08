import { checkReviewEligibility } from '../../services/review.service'
import { reviewEligibilityQuerySchema } from '../../utils/schemas/review.schema'

export default defineApiHandler(async (event) => {
  const session = await requireUserSession(event)
  const { productId } = await getValidatedQuery(event, reviewEligibilityQuerySchema.parse)
  return checkReviewEligibility(session.user.id, productId)
})
