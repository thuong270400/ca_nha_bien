import { orderStatusUpdateSchema } from '#shared/schemas/order.schema'
import { updateOrderStatus } from '../../services/order.service'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  const input = await readValidatedBody(event, orderStatusUpdateSchema.parse)
  return updateOrderStatus(id, input.status)
})
