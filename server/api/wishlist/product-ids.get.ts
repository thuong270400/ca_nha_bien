import { listWishlistProductIds } from '../../services/wishlist.service'

export default defineApiHandler(async (event) => {
  const session = await requireUserSession(event)
  return listWishlistProductIds(session.user.id)
})
