import { updateSocialLink } from '../../../services/social-link.service'
import { socialLinkUpdateSchema } from '../../../utils/schemas/social-link.schema'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  const input = await readValidatedBody(event, socialLinkUpdateSchema.parse)
  return updateSocialLink(id, input)
})
