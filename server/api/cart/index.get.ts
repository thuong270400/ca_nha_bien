import { getCart } from '../../services/cart.service'

export default defineApiHandler(async (event) => {
  const cartId = await resolveCartId(event)
  return getCart(cartId)
})
