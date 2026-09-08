import { deleteAddress } from '../../services/address.service'

export default defineApiHandler(async (event) => {
  const session = await requireUserSession(event)
  const id = getRouterParam(event, 'id')!
  await deleteAddress(session.user.id, id)
  return { success: true }
})
