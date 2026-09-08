import { loginSchema } from '#shared/schemas/auth.schema'
import { verifyLogin } from '../../services/auth.service'

export default defineApiHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  checkRateLimit(`login:${ip}`, { max: 10, windowMs: 15 * 60_000 })

  const input = await readValidatedBody(event, loginSchema.parse)
  checkRateLimit(`login:${ip}:${input.email}`, { max: 5, windowMs: 15 * 60_000 })
  const user = await verifyLogin(input)

  await setUserSession(event, {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    loggedInAt: new Date().toISOString(),
  })
  await resolveCartId(event)

  return user
})
