import { addCartItem } from '../../../services/cart.service'
import { cartAddItemSchema } from '../../../utils/schemas/cart.schema'

export default defineApiHandler(async (event) => {
  const cartId = await resolveCartId(event)
  const input = await readValidatedBody(event, cartAddItemSchema.parse)
  return addCartItem(cartId, input.variantId, input.quantity)
})
