import { Prisma } from '../generated/prisma/client'
import { Errors } from '../utils/errors'
import { prisma } from '../utils/prisma'

export async function listCustomers(query: { page: number, limit: number, q?: string }) {
  const where: Prisma.UserWhereInput = { role: 'CUSTOMER' }
  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: 'insensitive' } },
      { email: { contains: query.q, mode: 'insensitive' } },
    ]
  }

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    }),
    prisma.user.count({ where }),
  ])

  return {
    data,
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  }
}

export async function setCustomerActive(id: string, isActive: boolean) {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user || user.role !== 'CUSTOMER') throw Errors.notFound('Không tìm thấy khách hàng')
  return prisma.user.update({
    where: { id },
    data: { isActive },
    select: { id: true, name: true, email: true, phone: true, isActive: true, createdAt: true },
  })
}

export async function promoteToAdmin(id: string) {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user || user.role !== 'CUSTOMER') throw Errors.notFound('Không tìm thấy khách hàng')
  return prisma.user.update({
    where: { id },
    data: { role: 'ADMIN' },
    select: { id: true, name: true, email: true, phone: true, isActive: true, createdAt: true },
  })
}
