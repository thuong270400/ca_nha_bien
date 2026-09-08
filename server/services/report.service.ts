import { prisma } from '../utils/prisma'

export async function getRevenueOverTime(from: Date, to: Date, groupBy: 'day' | 'month') {
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: from, lte: to }, status: { not: 'CANCELLED' } },
    select: { createdAt: true, total: true },
  })

  const buckets = new Map<string, number>()
  for (const order of orders) {
    const key = groupBy === 'day'
      ? order.createdAt.toISOString().slice(0, 10)
      : order.createdAt.toISOString().slice(0, 7)
    buckets.set(key, (buckets.get(key) ?? 0) + Number(order.total))
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, revenue]) => ({ date, revenue }))
}

export async function getTopSellingProducts(from: Date, to: Date, limit = 10) {
  const rows = await prisma.orderItem.groupBy({
    by: ['productId', 'productName'],
    where: { order: { createdAt: { gte: from, lte: to }, status: { not: 'CANCELLED' } } },
    _sum: { quantity: true, lineTotal: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: limit,
  })

  return rows.map(r => ({
    productId: r.productId,
    productName: r.productName,
    quantity: r._sum.quantity ?? 0,
    revenue: r._sum.lineTotal?.toString() ?? '0',
  }))
}

export async function getOrderStatusBreakdown(from: Date, to: Date) {
  const rows = await prisma.order.groupBy({
    by: ['status'],
    where: { createdAt: { gte: from, lte: to } },
    _count: true,
  })

  return rows.map(r => ({ status: r.status, count: r._count }))
}

export async function getDateRangeReport(from: Date, to: Date, groupBy: 'day' | 'month') {
  const [revenueOverTime, topProducts, statusBreakdown] = await Promise.all([
    getRevenueOverTime(from, to, groupBy),
    getTopSellingProducts(from, to),
    getOrderStatusBreakdown(from, to),
  ])
  return { revenueOverTime, topProducts, statusBreakdown }
}
