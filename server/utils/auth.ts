import type { H3Event } from 'h3'
import { Errors } from './errors'

export async function requireAdmin(event: H3Event) {
  const session = await requireUserSession(event)
  if (session.user.role !== 'ADMIN') {
    throw Errors.forbidden('Chỉ quản trị viên mới có quyền truy cập')
  }
  return session
}
