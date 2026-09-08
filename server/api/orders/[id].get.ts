import { getOrderById } from '../../services/order.service'

export default defineApiHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const session = await getUserSession(event)
  const isAdmin = session.user?.role === 'ADMIN'
  const guestOrderIds = getGuestOrderIds(event)

  return getOrderById(id, {
    userId: session.user?.id ?? null,
    isAdmin,
    guestAccessGranted: guestOrderIds.includes(id),
  })
})
