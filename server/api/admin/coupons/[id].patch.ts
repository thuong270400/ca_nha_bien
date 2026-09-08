import { updateCoupon } from '../../../services/coupon.service'
import { couponUpdateSchema } from '../../../utils/schemas/coupon.schema'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  const input = await readValidatedBody(event, couponUpdateSchema.parse)
  return updateCoupon(id, input)
})
