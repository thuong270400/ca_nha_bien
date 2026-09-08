import { listContactMessages } from '../../../services/contact.service'
import { contactListQuerySchema } from '../../../utils/schemas/contact-query.schema'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const query = await getValidatedQuery(event, contactListQuerySchema.parse)
  return listContactMessages(query)
})
