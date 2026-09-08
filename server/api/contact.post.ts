import { contactSchema } from '#shared/schemas/contact.schema'
import { createContactMessage } from '../services/contact.service'

export default defineApiHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  checkRateLimit(`contact:${ip}`, { max: 5, windowMs: 60 * 60_000 })

  const input = await readValidatedBody(event, contactSchema.parse)
  return createContactMessage(input)
})
