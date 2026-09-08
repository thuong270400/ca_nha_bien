import { deletePost } from '../../../services/post.service'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  await deletePost(id)
  return { success: true }
})
