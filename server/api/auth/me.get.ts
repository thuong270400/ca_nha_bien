import { toSafeUser } from '../../services/auth.service'

export default defineApiHandler(async (event) => {
  const session = await requireUserSession(event)
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) throw Errors.notFound('Không tìm thấy người dùng')
  return toSafeUser(user)
})
