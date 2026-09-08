import { deleteCoupon } from '../../../services/coupon.service'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  await deleteCoupon(id)
  return { success: true }
})
