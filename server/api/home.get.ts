import { getActiveBanners } from '../services/banner.service'
import { listCategories } from '../services/category.service'
import { getBestSellingProducts, getNewArrivalProducts, getOnSaleProducts } from '../services/product.service'

export default defineApiHandler(async () => {
  const [bestSelling, newArrivals, onSale, categories, banners] = await Promise.all([
    getBestSellingProducts(8),
    getNewArrivalProducts(8),
    getOnSaleProducts(8),
    listCategories(true),
    getActiveBanners(),
  ])

  return { bestSelling, newArrivals, onSale, categories, banners }
})
