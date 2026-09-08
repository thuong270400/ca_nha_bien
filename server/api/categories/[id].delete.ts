import { deleteCategory } from '../../services/category.service'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  await deleteCategory(id)
  return { success: true }
})
