import type { AddressInput } from '#shared/schemas/address.schema'
import { Errors } from '../utils/errors'
import { prisma } from '../utils/prisma'

export async function listAddresses(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  })
}

async function assertOwnership(userId: string, id: string) {
  const address = await prisma.address.findUnique({ where: { id } })
  if (!address || address.userId !== userId) throw Errors.notFound('Không tìm thấy địa chỉ')
  return address
}

export async function createAddress(userId: string, input: AddressInput) {
  if (input.isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } })
  }
  const existingCount = await prisma.address.count({ where: { userId } })
  return prisma.address.create({
    data: { ...input, userId, isDefault: input.isDefault ?? existingCount === 0 },
  })
}

export async function updateAddress(userId: string, id: string, input: Partial<AddressInput>) {
  await assertOwnership(userId, id)
  if (input.isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } })
  }
  return prisma.address.update({ where: { id }, data: input })
}

export async function deleteAddress(userId: string, id: string) {
  await assertOwnership(userId, id)
  await prisma.address.delete({ where: { id } })
}
