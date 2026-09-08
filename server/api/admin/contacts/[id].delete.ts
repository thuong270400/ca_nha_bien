import { deleteContactMessage } from '../../../services/contact.service'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  await deleteContactMessage(id)
  return { success: true }
})
