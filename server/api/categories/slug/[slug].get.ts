import { getCategoryBySlug } from '../../../services/category.service'

export default defineApiHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  return getCategoryBySlug(slug)
})
