import { getActivePostCategoryBySlug } from '../../../services/post-category.service'

export default defineApiHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  return getActivePostCategoryBySlug(slug)
})
