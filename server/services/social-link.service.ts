import { Errors } from '../utils/errors'
import { prisma } from '../utils/prisma'
import type { SocialLinkCreateInput, SocialLinkUpdateInput } from '../utils/schemas/social-link.schema'
import { deleteImage } from './upload.service'

export async function listSocialLinks() {
  return prisma.socialLink.findMany({ orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] })
}

export async function getActiveSocialLinks() {
  return prisma.socialLink.findMany({
    where: { isActive: true },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
  })
}

async function getSocialLinkById(id: string) {
  const link = await prisma.socialLink.findUnique({ where: { id } })
  if (!link) throw Errors.notFound('Không tìm thấy liên kết mạng xã hội')
  return link
}

export async function createSocialLink(input: SocialLinkCreateInput) {
  return prisma.socialLink.create({ data: input })
}

export async function updateSocialLink(id: string, input: SocialLinkUpdateInput) {
  const existing = await getSocialLinkById(id)
  const link = await prisma.socialLink.update({ where: { id }, data: input })
  // Clean up the old custom icon whenever it's no longer the one referenced by the
  // updated row (replaced with a new upload, or the link switched to a preset icon).
  const oldImageStillUsed = link.iconType === 'CUSTOM' && link.imageUrl === existing.imageUrl
  if (existing.imageUrl && !oldImageStillUsed) await deleteImage(existing.imageUrl)
  return link
}

export async function deleteSocialLink(id: string) {
  const existing = await getSocialLinkById(id)
  await prisma.socialLink.delete({ where: { id } })
  if (existing.imageUrl) await deleteImage(existing.imageUrl)
}
