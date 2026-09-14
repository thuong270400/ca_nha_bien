import { getActiveBanners } from '../services/banner.service'
import { getHomepageCategorySections } from '../services/category.service'
import { listPromotedCoupons } from '../services/coupon.service'

export default defineApiHandler(async () => {
  const [categorySections, banners, promotedCoupons] = await Promise.all([
    getHomepageCategorySections(),
    getActiveBanners(),
    listPromotedCoupons(),
  ])

  return { categorySections, banners, promotedCoupons }
})
