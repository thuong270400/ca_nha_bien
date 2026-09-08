import { createProduct } from '../../services/product.service'
import { productCreateSchema } from '../../utils/schemas/product.schema'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const input = await readValidatedBody(event, productCreateSchema.parse)
  return createProduct(input)
})
