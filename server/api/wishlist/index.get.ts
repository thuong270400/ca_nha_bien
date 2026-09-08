import { listWishlist } from '../../services/wishlist.service'

export default defineApiHandler(async (event) => {
  const session = await requireUserSession(event)
  return listWishlist(session.user.id)
})
