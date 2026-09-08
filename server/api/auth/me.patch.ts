import { updateProfileSchema } from '#shared/schemas/auth.schema'
import { updateProfile } from '../../services/auth.service'

export default defineApiHandler(async (event) => {
  const session = await requireUserSession(event)
  const input = await readValidatedBody(event, updateProfileSchema.parse)
  const user = await updateProfile(session.user.id, input)

  await replaceUserSession(event, {
    ...session,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  })

  return user
})
