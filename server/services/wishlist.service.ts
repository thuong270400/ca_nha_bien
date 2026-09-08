import { Errors } from '../utils/errors'
import { prisma } from '../utils/prisma'
import { productInclude } from './product.service'

export async function listWishlist(userId: string) {
  return prisma.wishlist.findMany({
    where: { userId },
    include: { product: { include: productInclude } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function listWishlistProductIds(userId: string) {
  const rows = await prisma.wishlist.findMany({ where: { userId }, select: { productId: true } })
  return rows.map(r => r.productId)
}

export async function addToWishlist(userId: string, productId: string) {
  const product = await prisma.product.findFirst({ where: { id: productId, deletedAt: null } })
  if (!product) throw Errors.notFound('Không tìm thấy sản phẩm')

  return prisma.wishlist.upsert({
    where: { userId_productId: { userId, productId } },
    create: { userId, productId },
    update: {},
  })
}

export async function removeFromWishlist(userId: string, productId: string) {
  await prisma.wishlist.deleteMany({ where: { userId, productId } })
}
