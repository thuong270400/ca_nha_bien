import { createSocialLink } from '../../../services/social-link.service'
import { socialLinkCreateSchema } from '../../../utils/schemas/social-link.schema'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const input = await readValidatedBody(event, socialLinkCreateSchema.parse)
  return createSocialLink(input)
})
