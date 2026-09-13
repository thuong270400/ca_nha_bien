import { getActiveBanners } from '../services/banner.service'
import { getHomepageCategorySections } from '../services/category.service'
import { getOnSaleProducts } from '../services/product.service'

export default defineApiHandler(async () => {
  const [categorySections, onSale, banners] = await Promise.all([
    getHomepageCategorySections(3),
    getOnSaleProducts(8),
    getActiveBanners(),
  ])

  return { categorySections, onSale, banners }
})
