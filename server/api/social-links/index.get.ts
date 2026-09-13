import { getActiveSocialLinks } from '../../services/social-link.service'

export default defineApiHandler(async () => {
  return getActiveSocialLinks()
})
