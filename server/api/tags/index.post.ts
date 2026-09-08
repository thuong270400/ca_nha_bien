import { createTag } from '../../services/tag.service'
import { tagCreateSchema } from '../../utils/schemas/tag.schema'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const input = await readValidatedBody(event, tagCreateSchema.parse)
  return createTag(input)
})
