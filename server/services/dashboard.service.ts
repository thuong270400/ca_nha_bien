import { prisma } from '../utils/prisma'

const LOW_STOCK_THRESHOLD = 5

export async function getDashboardStats() {
  const [revenueAgg, orderCount, pendingOrders, customerCount, productCount, lowStockVariants, recentOrders] = await Promise.all([
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: 'CANCELLED' } } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.productVariant.findMany({
      where: { stock: { lte: LOW_STOCK_THRESHOLD }, product: { deletedAt: null, status: 'ACTIVE' } },
      include: { product: { select: { id: true, name: true, slug: true } } },
      orderBy: { stock: 'asc' },
      take: 10,
    }),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, orderNumber: true, status: true, total: true, recipientName: true, createdAt: true },
    }),
  ])

  return {
    totalRevenue: (revenueAgg._sum.total ?? 0).toString(),
    orderCount,
    pendingOrders,
    customerCount,
    productCount,
    lowStockVariants,
    recentOrders,
  }
}
