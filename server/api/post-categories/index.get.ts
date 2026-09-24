import { listPostCategories } from '../../services/post-category.service'
import { postCategoryListQuerySchema } from '../../utils/schemas/post-category.schema'

export default defineApiHandler(async (event) => {
  const query = await getValidatedQuery(event, postCategoryListQuerySchema.parse)
  return listPostCategories(query.activeOnly)
})
