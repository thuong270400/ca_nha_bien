import type { ContactInput } from '#shared/schemas/contact.schema'
import { Errors } from '../utils/errors'
import { prisma } from '../utils/prisma'

interface ContactListQuery {
  page: number
  limit: number
  isRead?: boolean
}

export async function createContactMessage(input: ContactInput) {
  return prisma.contactMessage.create({ data: input })
}

export async function listContactMessages(query: ContactListQuery) {
  const where = query.isRead !== undefined ? { isRead: query.isRead } : undefined
  const [data, total] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.contactMessage.count({ where }),
  ])
  return { data, meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } }
}

async function getContactMessageById(id: string) {
  const message = await prisma.contactMessage.findUnique({ where: { id } })
  if (!message) throw Errors.notFound('Không tìm thấy tin nhắn')
  return message
}

export async function markContactMessageRead(id: string, isRead: boolean) {
  await getContactMessageById(id)
  return prisma.contactMessage.update({ where: { id }, data: { isRead } })
}

export async function deleteContactMessage(id: string) {
  await getContactMessageById(id)
  await prisma.contactMessage.delete({ where: { id } })
}
