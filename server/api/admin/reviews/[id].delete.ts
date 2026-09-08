import { deleteReview } from '../../../services/review.service'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  await deleteReview(id)
  return { success: true }
})
