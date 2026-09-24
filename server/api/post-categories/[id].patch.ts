import { updatePostCategory } from '../../services/post-category.service'
import { postCategoryUpdateSchema } from '../../utils/schemas/post-category.schema'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  const input = await readValidatedBody(event, postCategoryUpdateSchema.parse)
  return updatePostCategory(id, input)
})
