import { getPublishedPostBySlug } from '../../../services/post.service'

export default defineApiHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  return getPublishedPostBySlug(slug)
})
