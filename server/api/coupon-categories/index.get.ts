import { listCouponCategories } from '../../services/coupon-category.service'
import { couponCategoryListQuerySchema } from '../../utils/schemas/coupon-category.schema'

export default defineApiHandler(async (event) => {
  const query = await getValidatedQuery(event, couponCategoryListQuerySchema.parse)
  return listCouponCategories(query.activeOnly)
})
