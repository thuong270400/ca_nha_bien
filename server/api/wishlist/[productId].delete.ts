import { removeFromWishlist } from '../../services/wishlist.service'

export default defineApiHandler(async (event) => {
  const session = await requireUserSession(event)
  const productId = getRouterParam(event, 'productId')!
  await removeFromWishlist(session.user.id, productId)
  return { success: true }
})
