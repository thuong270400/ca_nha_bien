import { updateCategory } from '../../services/category.service'
import { categoryUpdateSchema } from '../../utils/schemas/category.schema'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  const input = await readValidatedBody(event, categoryUpdateSchema.parse)
  return updateCategory(id, input)
})
