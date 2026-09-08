import { deleteImage } from '../../services/upload.service'
import { deleteUploadSchema } from '../../utils/schemas/upload.schema'

/**
 * Deletes a just-uploaded, not-yet-saved image (e.g. the admin uploaded it then
 * clicked "x" or replaced it before hitting Save). Images already attached to a
 * saved product/post/banner are cleaned up server-side when the entity is
 * updated/deleted instead (see syncImages in product.service.ts and the
 * equivalent logic in post.service.ts / banner.service.ts).
 */
export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const { url } = await readValidatedBody(event, deleteUploadSchema.parse)
  await deleteImage(url)
  return { success: true }
})
