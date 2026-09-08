import { getProductBySlug, getRelatedProducts } from '../../../services/product.service'

export default defineApiHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const product = await getProductBySlug(slug)
  const related = await getRelatedProducts(product.id, product.categoryId)
  return { ...product, related }
})
