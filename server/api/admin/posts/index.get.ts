import { listAllPosts } from '../../../services/post.service'
import { postAdminListQuerySchema } from '../../../utils/schemas/post.schema'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const query = await getValidatedQuery(event, postAdminListQuerySchema.parse)
  return listAllPosts(query)
})
