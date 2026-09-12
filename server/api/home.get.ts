import { getActiveBanners } from '../services/banner.service'
import { getFeaturedCategories } from '../services/category.service'
import { getBestSellingProducts, getOnSaleProducts } from '../services/product.service'

export default defineApiHandler(async () => {
  const [bestSelling, onSale, categories, banners] = await Promise.all([
    getBestSellingProducts(8),
    getOnSaleProducts(8),
    getFeaturedCategories(3),
    getActiveBanners(),
  ])

  return { bestSelling, onSale, categories, banners }
})
