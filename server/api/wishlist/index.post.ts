import { addToWishlist } from '../../services/wishlist.service'
import { wishlistAddSchema } from '../../utils/schemas/wishlist.schema'

export default defineApiHandler(async (event) => {
  const session = await requireUserSession(event)
  const { productId } = await readValidatedBody(event, wishlistAddSchema.parse)
  return addToWishlist(session.user.id, productId)
})
