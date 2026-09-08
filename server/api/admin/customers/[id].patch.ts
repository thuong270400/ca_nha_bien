import { z } from 'zod'
import { promoteToAdmin, setCustomerActive } from '../../../services/customer.service'

const bodySchema = z.union([
  z.object({ isActive: z.boolean() }),
  z.object({ role: z.literal('ADMIN') }),
])

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  const input = await readValidatedBody(event, bodySchema.parse)
  return 'role' in input ? promoteToAdmin(id) : setCustomerActive(id, input.isActive)
})
