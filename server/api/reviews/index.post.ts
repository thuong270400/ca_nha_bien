import { reviewCreateSchema } from '#shared/schemas/review.schema'
import { createReview } from '../../services/review.service'

export default defineApiHandler(async (event) => {
  const session = await requireUserSession(event)
  const input = await readValidatedBody(event, reviewCreateSchema.parse)
  return createReview(session.user.id, input)
})
