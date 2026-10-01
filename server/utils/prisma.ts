import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'


function createPrismaClient() {
  const adapter = new PrismaPg(
    { connectionString: process.env.DATABASE_URL },
    { schema: process.env.DB_SCHEMA || 'fiship' },
  )
  // Giá nhập kho (Product.importPrice) là dữ liệu nội bộ: ẩn mặc định ở MỌI
  // query để không lọt ra API công khai (storefront, giỏ hàng, wishlist...).
  // Query admin bật lại bằng `omit: { importPrice: false }`.
  return new PrismaClient({ adapter, omit: { product: { importPrice: true } } })
}

const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createPrismaClient> }

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
