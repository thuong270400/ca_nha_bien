import { addressSchema } from '#shared/schemas/address.schema'
import { createAddress } from '../../services/address.service'

export default defineApiHandler(async (event) => {
  const session = await requireUserSession(event)
  const input = await readValidatedBody(event, addressSchema.parse)
  return createAddress(session.user.id, input)
})
