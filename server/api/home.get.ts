import { getActiveBanners } from '../services/banner.service'
import { getHomepageCategorySections } from '../services/category.service'
import { getHomepageCombos } from '../services/combo.service'
import { listPromotedCoupons } from '../services/coupon.service'

export default defineApiHandler(async () => {
  const [categorySections, banners, promotedCoupons, combos] = await Promise.all([
    getHomepageCategorySections(),
    getActiveBanners(),
    listPromotedCoupons(),
    getHomepageCombos(),
  ])

  return { categorySections, banners, promotedCoupons, combos }
})
