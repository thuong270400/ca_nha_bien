import { createPost } from '../../../services/post.service'
import { postCreateSchema } from '../../../utils/schemas/post.schema'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const input = await readValidatedBody(event, postCreateSchema.parse)
  return createPost(input)
})
