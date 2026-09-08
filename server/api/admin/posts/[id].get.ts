import { getPostById } from '../../../services/post.service'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  return getPostById(id)
})
