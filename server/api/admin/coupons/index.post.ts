import { createCoupon } from '../../../services/coupon.service'
import { couponCreateSchema } from '../../../utils/schemas/coupon.schema'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const input = await readValidatedBody(event, couponCreateSchema.parse)
  return createCoupon(input)
})
