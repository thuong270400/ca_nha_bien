import type { ReviewCreateInput } from '#shared/schemas/review.schema'
import type { Prisma } from '../generated/prisma/client'
import { Errors } from '../utils/errors'
import { prisma } from '../utils/prisma'
import type { AdminReviewListQuery } from '../utils/schemas/review.schema'

const reviewUserSelect = { user: { select: { name: true } } } satisfies Prisma.ReviewInclude

export async function checkReviewEligibility(userId: string, productId: string) {
  const [existingReview, deliveredOrder] = await Promise.all([
    prisma.review.findUnique({ where: { userId_productId: { userId, productId } } }),
    prisma.order.findFirst({
      where: { userId, status: 'DELIVERED', items: { some: { productId } } },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    }),
  ])

  return {
    eligible: !existingReview && Boolean(deliveredOrder),
    alreadyReviewed: Boolean(existingReview),
    orderId: deliveredOrder?.id ?? null,
  }
}

export async function createReview(userId: string, input: ReviewCreateInput) {
  const eligibility = await checkReviewEligibility(userId, input.productId)
  if (eligibility.alreadyReviewed) throw Errors.conflict('Bạn đã đánh giá sản phẩm này rồi')
  if (!eligibility.orderId) throw Errors.forbidden('Bạn cần mua và nhận sản phẩm này để đánh giá')

  return prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        productId: input.productId,
        userId,
        orderId: eligibility.orderId!,
        rating: input.rating,
        comment: input.comment,
      },
      include: reviewUserSelect,
    })
    await syncProductRatingAggregate(tx, input.productId)
    return review
  })
}

export async function listReviewsForProduct(productId: string, opts: { page: number, limit: number }) {
  const where: Prisma.ReviewWhereInput = { productId, isHidden: false }

  const [data, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: reviewUserSelect,
      orderBy: { createdAt: 'desc' },
      skip: (opts.page - 1) * opts.limit,
      take: opts.limit,
    }),
    prisma.review.count({ where }),
  ])

  return {
    data,
    meta: {
      page: opts.page,
      limit: opts.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / opts.limit)),
    },
  }
}

export async function listReviewsForAdmin(query: AdminReviewListQuery) {
  const where: Prisma.ReviewWhereInput = {
    productId: query.productId,
    isHidden: query.isHidden,
  }

  const [data, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: { user: { select: { name: true } }, product: { select: { id: true, name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.review.count({ where }),
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

export async function setReviewHidden(id: string, isHidden: boolean) {
  const review = await prisma.review.findUnique({ where: { id } })
  if (!review) throw Errors.notFound('Không tìm thấy đánh giá')

  return prisma.$transaction(async (tx) => {
    const updated = await tx.review.update({ where: { id }, data: { isHidden } })
    await syncProductRatingAggregate(tx, review.productId)
    return updated
  })
}

export async function deleteReview(id: string) {
  const review = await prisma.review.findUnique({ where: { id } })
  if (!review) throw Errors.notFound('Không tìm thấy đánh giá')

  await prisma.$transaction(async (tx) => {
    await tx.review.delete({ where: { id } })
    await syncProductRatingAggregate(tx, review.productId)
  })
}

async function syncProductRatingAggregate(tx: Prisma.TransactionClient, productId: string) {
  const agg = await tx.review.aggregate({
    where: { productId, isHidden: false },
    _avg: { rating: true },
    _count: { _all: true },
  })
  await tx.product.update({
    where: { id: productId },
    data: {
      avgRating: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : 0,
      reviewCount: agg._count._all,
    },
  })
}
