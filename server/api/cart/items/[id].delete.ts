import { removeCartItem } from '../../../services/cart.service'

export default defineApiHandler(async (event) => {
  const cartId = await resolveCartId(event)
  const itemId = getRouterParam(event, 'id')!
  return removeCartItem(cartId, itemId)
})
