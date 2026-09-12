import { getActiveBanners } from '../services/banner.service'
import { listCategories } from '../services/category.service'
import { getBestSellingProducts, getOnSaleProducts } from '../services/product.service'

export default defineApiHandler(async () => {
  const [bestSelling, onSale, categories, banners] = await Promise.all([
    getBestSellingProducts(8),
    getOnSaleProducts(8),
    listCategories(true),
    getActiveBanners(),
  ])

  return { bestSelling, onSale, categories, banners }
})
