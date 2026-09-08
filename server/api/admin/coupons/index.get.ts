import { listCoupons } from '../../../services/coupon.service'
import { couponListQuerySchema } from '../../../utils/schemas/coupon.schema'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const query = await getValidatedQuery(event, couponListQuerySchema.parse)
  return listCoupons(query)
})
