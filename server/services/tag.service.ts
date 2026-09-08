import { Errors } from '../utils/errors'
import { prisma } from '../utils/prisma'
import type { TagCreateInput, TagUpdateInput } from '../utils/schemas/tag.schema'

export async function listTags() {
  return prisma.tag.findMany({ orderBy: { name: 'asc' } })
}

async function assertSlugAvailable(slug: string, excludeId?: string) {
  const existing = await prisma.tag.findUnique({ where: { slug } })
  if (existing && existing.id !== excludeId) {
    throw Errors.conflict('Slug tag đã tồn tại')
  }
}

async function getTagById(id: string) {
  const tag = await prisma.tag.findUnique({ where: { id } })
  if (!tag) throw Errors.notFound('Không tìm thấy tag')
  return tag
}

export async function createTag(input: TagCreateInput) {
  await assertSlugAvailable(input.slug)
  return prisma.tag.create({ data: input })
}

export async function updateTag(id: string, input: TagUpdateInput) {
  await getTagById(id)
  if (input.slug) await assertSlugAvailable(input.slug, id)
  return prisma.tag.update({ where: { id }, data: input })
}

export async function deleteTag(id: string) {
  await getTagById(id)
  await prisma.tag.delete({ where: { id } })
}
