import { listOrders } from '../../services/order.service'
import { orderListQuerySchema } from '../../utils/schemas/order-query.schema'

export default defineApiHandler(async (event) => {
  const session = await requireUserSession(event)
  const query = await getValidatedQuery(event, orderListQuerySchema.parse)
  const isAdmin = session.user.role === 'ADMIN'
  return listOrders({ userId: session.user.id, isAdmin }, query)
})
