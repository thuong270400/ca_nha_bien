import { createBanner } from '../../../services/banner.service'
import { bannerCreateSchema } from '../../../utils/schemas/banner.schema'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const input = await readValidatedBody(event, bannerCreateSchema.parse)
  return createBanner(input)
})
