import { setReviewHidden } from '../../../services/review.service'
import { reviewModerateSchema } from '../../../utils/schemas/review.schema'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  const { isHidden } = await readValidatedBody(event, reviewModerateSchema.parse)
  return setReviewHidden(id, isHidden)
})
