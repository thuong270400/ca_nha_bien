import { registerSchema } from '#shared/schemas/auth.schema'
import { registerUser } from '../../services/auth.service'

export default defineApiHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  checkRateLimit(`register:${ip}`, { max: 5, windowMs: 60 * 60_000 })

  const input = await readValidatedBody(event, registerSchema.parse)
  const user = await registerUser(input)

  await setUserSession(event, {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    loggedInAt: new Date().toISOString(),
  })
  await resolveCartId(event)

  return user
})
