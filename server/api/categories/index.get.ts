import { listCategories } from '../../services/category.service'
import { categoryListQuerySchema } from '../../utils/schemas/category.schema'

export default defineApiHandler(async (event) => {
  const query = await getValidatedQuery(event, categoryListQuerySchema.parse)
  return listCategories(query.activeOnly)
})
