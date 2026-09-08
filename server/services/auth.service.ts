import bcrypt from 'bcryptjs'
import type { LoginInput, RegisterInput, UpdateProfileInput } from '#shared/schemas/auth.schema'
import { Errors } from '../utils/errors'
import { prisma } from '../utils/prisma'

const BCRYPT_ROUNDS = 12

export function toSafeUser<T extends { passwordHash: string }>(user: T) {
  const { passwordHash: _passwordHash, ...safe } = user
  return safe
}

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) throw Errors.conflict('Email đã được đăng ký')

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS)
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash,
    },
  })

  return toSafeUser(user)
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const user = await prisma.user.update({ where: { id: userId }, data: input })
  return toSafeUser(user)
}

export async function verifyLogin(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } })
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw Errors.badRequest('Email hoặc mật khẩu không đúng')
  }
  if (!user.isActive || user.deletedAt) {
    throw Errors.forbidden('Tài khoản đã bị vô hiệu hoá')
  }

  return toSafeUser(user)
}
