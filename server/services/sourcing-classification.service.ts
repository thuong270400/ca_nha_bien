import { Errors } from '../utils/errors'
import { prisma } from '../utils/prisma'
import type { SourcingClassificationCreateInput, SourcingClassificationUpdateInput } from '../utils/schemas/sourcing-classification.schema'

export async function listSourcingClassifications() {
  return prisma.sourcingClassification.findMany({ orderBy: { position: 'asc' } })
}

async function assertSlugAvailable(slug: string, excludeId?: string) {
  const existing = await prisma.sourcingClassification.findUnique({ where: { slug } })
  if (existing && existing.id !== excludeId) {
    throw Errors.conflict('Slug phân loại đã tồn tại')
  }
}

async function getSourcingClassificationById(id: string) {
  const item = await prisma.sourcingClassification.findUnique({ where: { id } })
  if (!item) throw Errors.notFound('Không tìm thấy phân loại')
  return item
}

export async function createSourcingClassification(input: SourcingClassificationCreateInput) {
  await assertSlugAvailable(input.slug)
  return prisma.sourcingClassification.create({ data: input })
}

export async function updateSourcingClassification(id: string, input: SourcingClassificationUpdateInput) {
  await getSourcingClassificationById(id)
  if (input.slug) await assertSlugAvailable(input.slug, id)
  return prisma.sourcingClassification.update({ where: { id }, data: input })
}

export async function deleteSourcingClassification(id: string) {
  await getSourcingClassificationById(id)
  await prisma.sourcingClassification.delete({ where: { id } })
}
