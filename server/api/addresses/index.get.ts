import { listAddresses } from '../../services/address.service'

export default defineApiHandler(async (event) => {
  const session = await requireUserSession(event)
  return listAddresses(session.user.id)
})
