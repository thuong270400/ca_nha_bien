import { getCart } from '../../services/cart.service'
import { listAvailableCoupons } from '../../services/coupon.service'

export default defineApiHandler(async (event) => {
  const cartId = await resolveCartId(event)
  const cart = await getCart(cartId)
  return listAvailableCoupons(Number(cart.subtotal))
})
