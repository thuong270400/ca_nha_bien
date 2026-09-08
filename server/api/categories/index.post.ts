import { createCategory } from '../../services/category.service'
import { categoryCreateSchema } from '../../utils/schemas/category.schema'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const input = await readValidatedBody(event, categoryCreateSchema.parse)
  return createCategory(input)
})
