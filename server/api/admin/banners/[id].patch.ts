import { updateBanner } from '../../../services/banner.service'
import { bannerUpdateSchema } from '../../../utils/schemas/banner.schema'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  const input = await readValidatedBody(event, bannerUpdateSchema.parse)
  return updateBanner(id, input)
})
