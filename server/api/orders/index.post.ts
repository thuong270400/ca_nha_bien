import { createOrderSchema } from '#shared/schemas/order.schema'
import { createOrder } from '../../services/order.service'

export default defineApiHandler(async (event) => {
  const session = await getUserSession(event)
  const userId = session.user?.id ?? null
  const cartId = await resolveCartId(event)
  const input = await readValidatedBody(event, createOrderSchema.parse)

  const order = await createOrder(input, { userId, cartId })

  if (!userId) {
    addGuestOrderId(event, order.id)
  }

  return order
})
