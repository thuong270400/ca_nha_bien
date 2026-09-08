import { deleteTag } from '../../services/tag.service'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  await deleteTag(id)
  return { success: true }
})
