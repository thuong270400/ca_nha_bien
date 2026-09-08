import { updatePost } from '../../../services/post.service'
import { postUpdateSchema } from '../../../utils/schemas/post.schema'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  const input = await readValidatedBody(event, postUpdateSchema.parse)
  return updatePost(id, input)
})
