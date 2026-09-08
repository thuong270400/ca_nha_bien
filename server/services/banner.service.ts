import { Errors } from '../utils/errors'
import { prisma } from '../utils/prisma'
import type { BannerCreateInput, BannerUpdateInput } from '../utils/schemas/banner.schema'
import { deleteImage } from './upload.service'

export async function listBanners() {
  return prisma.banner.findMany({ orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] })
}

export async function getActiveBanners() {
  return prisma.banner.findMany({
    where: { isActive: true },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
  })
}

async function getBannerById(id: string) {
  const banner = await prisma.banner.findUnique({ where: { id } })
  if (!banner) throw Errors.notFound('Không tìm thấy banner')
  return banner
}

export async function createBanner(input: BannerCreateInput) {
  return prisma.banner.create({ data: input })
}

export async function updateBanner(id: string, input: BannerUpdateInput) {
  const existing = await getBannerById(id)
  const banner = await prisma.banner.update({ where: { id }, data: input })
  if (input.imageUrl && input.imageUrl !== existing.imageUrl) await deleteImage(existing.imageUrl)
  return banner
}

export async function deleteBanner(id: string) {
  const existing = await getBannerById(id)
  await prisma.banner.delete({ where: { id } })
  await deleteImage(existing.imageUrl)
}
