import { createCouponCategory } from '../../services/coupon-category.service'
import { couponCategoryCreateSchema } from '../../utils/schemas/coupon-category.schema'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const input = await readValidatedBody(event, couponCategoryCreateSchema.parse)
  return createCouponCategory(input)
})
