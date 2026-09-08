import { listProducts } from '../../services/product.service'
import { productListQuerySchema } from '../../utils/schemas/product.schema'

export default defineApiHandler(async (event) => {
  const query = await getValidatedQuery(event, productListQuerySchema.parse)
  const session = await getUserSession(event)
  const isAdmin = session.user?.role === 'ADMIN'
  return listProducts(query, { includeInactive: isAdmin })
})
