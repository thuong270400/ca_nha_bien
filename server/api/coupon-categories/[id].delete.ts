import { deleteCouponCategory } from '../../services/coupon-category.service'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  await deleteCouponCategory(id)
  return { success: true }
})
