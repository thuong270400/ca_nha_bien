import { getProductById } from '../../services/product.service'

export default defineApiHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const session = await getUserSession(event)
  const isAdmin = session.user?.role === 'ADMIN'
  return getProductById(id, { includeInactive: isAdmin })
})
