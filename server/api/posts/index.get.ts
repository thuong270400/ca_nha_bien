import { listPosts } from '../../services/post.service'
import { postListQuerySchema } from '../../utils/schemas/post.schema'

export default defineApiHandler(async (event) => {
  const query = await getValidatedQuery(event, postListQuerySchema.parse)
  return listPosts(query)
})
