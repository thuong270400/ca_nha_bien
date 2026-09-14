import { updateCouponCategory } from '../../services/coupon-category.service'
import { couponCategoryUpdateSchema } from '../../utils/schemas/coupon-category.schema'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  const input = await readValidatedBody(event, couponCategoryUpdateSchema.parse)
  return updateCouponCategory(id, input)
})
