import { addressSchema } from '#shared/schemas/address.schema'
import { updateAddress } from '../../services/address.service'

export default defineApiHandler(async (event) => {
  const session = await requireUserSession(event)
  const id = getRouterParam(event, 'id')!
  const input = await readValidatedBody(event, addressSchema.partial().parse)
  return updateAddress(session.user.id, id, input)
})
