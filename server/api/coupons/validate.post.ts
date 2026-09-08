import { getCart } from '../../services/cart.service'
import { validateCoupon } from '../../services/coupon.service'
import { couponValidateSchema } from '../../utils/schemas/coupon.schema'

export default defineApiHandler(async (event) => {
  const cartId = await resolveCartId(event)
  const { code } = await readValidatedBody(event, couponValidateSchema.parse)
  const cart = await getCart(cartId)
  const { coupon, discountAmount } = await validateCoupon(prisma, code, Number(cart.subtotal))
  return { code: coupon.code, type: coupon.type, discountAmount: discountAmount.toFixed(2) }
})
