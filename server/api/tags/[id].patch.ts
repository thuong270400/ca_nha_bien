import { updateTag } from '../../services/tag.service'
import { tagUpdateSchema } from '../../utils/schemas/tag.schema'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  const input = await readValidatedBody(event, tagUpdateSchema.parse)
  return updateTag(id, input)
})
