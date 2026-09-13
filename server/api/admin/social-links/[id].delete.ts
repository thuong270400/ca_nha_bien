import { deleteSocialLink } from '../../../services/social-link.service'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  await deleteSocialLink(id)
  return { success: true }
})
