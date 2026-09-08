import { z } from 'zod'
import { markContactMessageRead } from '../../../services/contact.service'

const markReadSchema = z.object({ isRead: z.boolean() })

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  const { isRead } = await readValidatedBody(event, markReadSchema.parse)
  return markContactMessageRead(id, isRead)
})
