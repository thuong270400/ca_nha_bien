import { createPostCategory } from '../../services/post-category.service'
import { postCategoryCreateSchema } from '../../utils/schemas/post-category.schema'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const input = await readValidatedBody(event, postCategoryCreateSchema.parse)
  return createPostCategory(input)
})
