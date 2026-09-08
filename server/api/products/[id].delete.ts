import { deleteProduct } from '../../services/product.service'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  await deleteProduct(id)
  return { success: true }
})
