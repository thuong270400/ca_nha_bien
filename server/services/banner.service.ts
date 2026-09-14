import { Prisma } from '../generated/prisma/client'
import { Errors } from '../utils/errors'
import { prisma } from '../utils/prisma'
import type { BannerButtonInput, BannerCreateInput, BannerUpdateInput } from '../utils/schemas/banner.schema'
import { deleteImage } from './upload.service'

const buttonsOrderBy = { buttons: { orderBy: { position: 'asc' } as const } }

export async function listBanners() {
  return prisma.banner.findMany({ orderBy: [{ position: 'asc' }, { createdAt: 'asc' }], include: buttonsOrderBy })
}

export async function getActiveBanners() {
  return prisma.banner.findMany({
    where: { isActive: true },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    include: buttonsOrderBy,
  })
}

async function getBannerById(id: string) {
  const banner = await prisma.banner.findUnique({ where: { id } })
  if (!banner) throw Errors.notFound('Không tìm thấy banner')
  return banner
}

export async function createBanner(input: BannerCreateInput) {
  const { buttons, ...data } = input
  return prisma.banner.create({
    data: {
      ...data,
      buttons: buttons ? { create: buttons.map((b, idx) => ({ ...b, position: b.position ?? idx })) } : undefined,
    },
    include: buttonsOrderBy,
  })
}

export async function updateBanner(id: string, input: BannerUpdateInput) {
  const existing = await getBannerById(id)
  const { buttons, ...data } = input

  const banner = await prisma.$transaction(async (tx) => {
    if (buttons) await syncButtons(tx, id, buttons)
    return tx.banner.update({ where: { id }, data, include: buttonsOrderBy })
  })

  if ('imageUrl' in input && input.imageUrl !== existing.imageUrl) await deleteImage(existing.imageUrl)
  return banner
}

async function syncButtons(tx: Prisma.TransactionClient, bannerId: string, buttons: BannerButtonInput[]) {
  await tx.bannerButton.deleteMany({ where: { bannerId } })
  if (buttons.length === 0) return
  await tx.bannerButton.createMany({
    data: buttons.map((b, idx) => ({ bannerId, label: b.label, link: b.link, position: b.position ?? idx })),
  })
}

export async function deleteBanner(id: string) {
  const existing = await getBannerById(id)
  await prisma.banner.delete({ where: { id } })
  await deleteImage(existing.imageUrl)
}
