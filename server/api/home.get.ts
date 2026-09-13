import { getActiveBanners } from '../services/banner.service'
import { getHomepageCategorySections } from '../services/category.service'

export default defineApiHandler(async () => {
  const [categorySections, banners] = await Promise.all([
    getHomepageCategorySections(),
    getActiveBanners(),
  ])

  return { categorySections, banners }
})
