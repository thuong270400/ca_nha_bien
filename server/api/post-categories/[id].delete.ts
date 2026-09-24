import { deletePostCategory } from '../../services/post-category.service'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  await deletePostCategory(id)
  return { success: true }
})
