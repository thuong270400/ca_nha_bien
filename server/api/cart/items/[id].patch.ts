import { updateCartItem } from '../../../services/cart.service'
import { cartUpdateItemSchema } from '../../../utils/schemas/cart.schema'

export default defineApiHandler(async (event) => {
  const cartId = await resolveCartId(event)
  const itemId = getRouterParam(event, 'id')!
  const input = await readValidatedBody(event, cartUpdateItemSchema.parse)
  return updateCartItem(cartId, itemId, input.quantity)
})
