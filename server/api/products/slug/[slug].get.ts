import { getProductBySlug, getRelatedProducts } from '../../../services/product.service'

export default defineApiHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const product = await getProductBySlug(slug)
  const related = await getRelatedProducts(product.id, product.categories.map(c => c.id))
  return { ...product, related }
})
