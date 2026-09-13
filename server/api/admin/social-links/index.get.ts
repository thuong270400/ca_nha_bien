import { listSocialLinks } from '../../../services/social-link.service'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  return listSocialLinks()
})
