import { updateProduct } from '../../services/product.service'
import { productUpdateSchema } from '../../utils/schemas/product.schema'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  const input = await readValidatedBody(event, productUpdateSchema.parse)
  return updateProduct(id, input)
})
