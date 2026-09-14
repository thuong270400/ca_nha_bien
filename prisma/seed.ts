import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from '../server/utils/prisma'
import { DEFAULT_FREE_SHIPPING_THRESHOLD, DEFAULT_SHIPPING_FEE, SETTINGS_ID } from '../server/utils/shipping'

const BCRYPT_ROUNDS = 12

async function resetDatabase() {
  await prisma.setting.deleteMany()
  await prisma.review.deleteMany()
  await prisma.wishlist.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.shipping.deleteMany()
  await prisma.order.deleteMany()
  await prisma.coupon.deleteMany()
  await prisma.couponCategory.deleteMany()
  await prisma.cartItem.deleteMany()
  await prisma.cart.deleteMany()
  await prisma.productImage.deleteMany()
  await prisma.productVariant.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.address.deleteMany()
  await prisma.user.deleteMany()
}

const categorySeeds = [
  { name: 'Cá nguyên con cấp đông', slug: 'ca-nguyen-con-cap-dong', description: 'Cá biển nguyên con, cấp đông ngay sau đánh bắt để giữ trọn độ tươi.', imageUrl: '/images/seed/ca-nguyen-con-cap-dong.svg', position: 1, isFeatured: true },
  { name: 'Cá phi lê cấp đông', slug: 'ca-phi-le', description: 'Cá biển đã lóc xương, phi lê sẵn, cấp đông tiện chế biến.', imageUrl: '/images/seed/ca-phi-le.svg', position: 2, isFeatured: true },
  { name: 'Cá cắt khúc/cắt lát cấp đông', slug: 'ca-cat-khuc-cap-dong', description: 'Cá biển cắt khúc hoặc cắt lát sẵn, cấp đông tiện nấu ăn.', imageUrl: '/images/seed/ca-cat-khuc-cap-dong.svg', position: 3, isFeatured: true },
  { name: 'Cá đặc sản cấp đông', slug: 'ca-dac-san', description: 'Cá biển cao cấp cấp đông, số lượng có hạn: cá mú, cá hồng...', imageUrl: '/images/seed/ca-dac-san.svg', position: 4 },
  { name: 'Combo/Ưu đãi', slug: 'combo-uu-dai', description: 'Combo cá biển cấp đông tiết kiệm, ưu đãi theo tuần.', imageUrl: '/images/seed/combo-uu-dai.svg', position: 5 },
] as const

interface SeedVariant {
  unit: string
  price: number
  compareAtPrice?: number
  stock: number
  isDefault?: boolean
}

interface SeedProduct {
  name: string
  slug: string
  categorySlugs: Array<(typeof categorySeeds)[number]['slug']>
  origin: string
  description: string
  isFeatured?: boolean
  soldCount?: number
  variants: SeedVariant[]
}

const productSeeds: SeedProduct[] = [
  // Cá nguyên con cấp đông
  { name: 'Cá Bớp', slug: 'ca-bop', categorySlugs: ['ca-nguyen-con-cap-dong'], origin: 'Phú Quốc', description: 'Cá bớp nguyên con, cấp đông ngay sau đánh bắt, thịt dai ngọt, ít xương, phù hợp nấu lẩu hoặc nướng muối ớt.', soldCount: 34, variants: [{ unit: 'kg', price: 180000, stock: 15, isDefault: true }] },
  { name: 'Cá Chim Trắng', slug: 'ca-chim-trang', categorySlugs: ['ca-nguyen-con-cap-dong'], origin: 'Nha Trang', description: 'Cá chim trắng nguyên con cấp đông, thịt béo thơm, thích hợp chiên giòn hoặc hấp.', soldCount: 41, variants: [{ unit: 'kg', price: 150000, stock: 4, isDefault: true }, { unit: 'con', price: 95000, stock: 12 }] },
  { name: 'Cá Nục', slug: 'ca-nuc', categorySlugs: ['ca-nguyen-con-cap-dong', 'combo-uu-dai'], origin: 'Bình Thuận', description: 'Cá nục nguyên con cấp đông, thịt ngọt, giá bình dân, hợp kho hoặc chiên.', soldCount: 72, variants: [{ unit: 'kg', price: 55000, stock: 40, isDefault: true }] },

  // Cá phi lê cấp đông
  { name: 'Cá Ngừ Đại Dương Phi Lê', slug: 'ca-ngu-dai-duong', categorySlugs: ['ca-phi-le'], origin: 'Phú Yên', description: 'Cá ngừ đại dương phi lê, cấp đông theo công nghệ IQF giữ trọn độ tươi, thích hợp làm sashimi hoặc áp chảo.', isFeatured: true, soldCount: 58, variants: [{ unit: '500g', price: 135000, compareAtPrice: 155000, stock: 18, isDefault: true }] },
  { name: 'Cá Hồi Phi Lê Cấp Đông', slug: 'ca-hoi-dong-lanh', categorySlugs: ['ca-phi-le'], origin: 'Nhập khẩu Na Uy', description: 'Cá hồi phi lê cấp đông đạt chuẩn xuất khẩu, giữ trọn dinh dưỡng.', isFeatured: true, soldCount: 78, variants: [{ unit: '500g', price: 175000, compareAtPrice: 195000, stock: 20, isDefault: true }] },

  // Cá cắt khúc/cắt lát cấp đông
  { name: 'Cá Thu Cắt Khúc Cấp Đông', slug: 'ca-thu', categorySlugs: ['ca-cat-khuc-cap-dong'], origin: 'Vũng Tàu', description: 'Cá thu cắt khúc, cấp đông ngay sau đánh bắt để giữ trọn độ tươi, thịt chắc, ít xương dăm, thích hợp chiên hoặc kho.', isFeatured: true, soldCount: 86, variants: [{ unit: 'kg', price: 120000, compareAtPrice: 140000, stock: 20, isDefault: true }, { unit: '500g', price: 65000, stock: 30 }] },
  { name: 'Cá Saba Cắt Lát Cấp Đông', slug: 'ca-saba-dong-lanh', categorySlugs: ['ca-cat-khuc-cap-dong'], origin: 'Nhập khẩu Nhật Bản', description: 'Cá saba cắt lát, cấp đông theo chuẩn Nhật Bản, béo thơm, tiện lợi cho bữa ăn nhanh.', soldCount: 53, variants: [{ unit: 'hộp', price: 89000, stock: 24, isDefault: true }] },

  // Cá đặc sản cấp đông (cá biển cao cấp)
  { name: 'Cá Hồng', slug: 'ca-hong', categorySlugs: ['ca-dac-san'], origin: 'Kiên Giang', description: 'Cá hồng cấp đông, thịt trắng chắc, ít tanh, hợp chưng tương hoặc chiên xù.', soldCount: 22, variants: [{ unit: 'kg', price: 165000, stock: 10, isDefault: true }] },
  { name: 'Cá Mú', slug: 'ca-mu', categorySlugs: ['ca-dac-san', 'combo-uu-dai'], origin: 'Khánh Hòa', description: 'Cá mú cấp đông nguyên con, thịt dai chắc, thường dùng hấp xì dầu hoặc nấu lẩu.', soldCount: 19, variants: [{ unit: 'kg', price: 320000, compareAtPrice: 360000, stock: 8, isDefault: true }] },
]

async function main() {
  console.log('Resetting database...')
  await resetDatabase()

  console.log('Seeding settings...')
  await prisma.setting.create({
    data: { id: SETTINGS_ID, shippingFee: DEFAULT_SHIPPING_FEE, freeShippingThreshold: DEFAULT_FREE_SHIPPING_THRESHOLD },
  })

  console.log('Seeding coupon categories...')
  await prisma.couponCategory.create({ data: { name: 'Chung', slug: 'chung' } })

  console.log('Seeding categories...')
  const categoryBySlug = new Map<string, string>()
  for (const c of categorySeeds) {
    const category = await prisma.category.create({ data: c })
    categoryBySlug.set(c.slug, category.id)
  }

  console.log('Seeding products...')
  for (const p of productSeeds) {
    const categoryIds = p.categorySlugs.map(slug => categoryBySlug.get(slug)!)
    const defaultVariant = p.variants.find(v => v.isDefault) ?? p.variants[0]!

    await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        origin: p.origin,
        status: 'ACTIVE',
        isFeatured: p.isFeatured ?? false,
        soldCount: p.soldCount ?? 0,
        categories: { connect: categoryIds.map(id => ({ id })) },
        price: defaultVariant.price,
        compareAtPrice: defaultVariant.compareAtPrice,
        images: {
          create: [{ url: `/images/seed/${p.categorySlugs[0]}.svg`, alt: p.name, position: 0 }],
        },
        variants: {
          create: p.variants.map(v => ({
            unit: v.unit,
            price: v.price,
            compareAtPrice: v.compareAtPrice,
            stock: v.stock,
            isDefault: v === defaultVariant,
          })),
        },
      },
    })
  }

  console.log('Seeding admin account...')
  await prisma.user.create({
    data: {
      name: 'Quản trị viên Cá Nhà Biển',
      email: 'admin@fiship.vn',
      phone: '0900000000',
      role: 'ADMIN',
      passwordHash: await bcrypt.hash('Admin@123456', BCRYPT_ROUNDS),
    },
  })

  console.log('Seeding sample customers...')
  const sampleCustomers = [
    { name: 'Nguyễn Văn An', email: 'an.nguyen@example.com', phone: '0911111111', address: { fullName: 'Nguyễn Văn An', phone: '0911111111', province: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Phường Bến Nghé', addressLine: '12 Nguyễn Huệ' } },
    { name: 'Trần Thị Bích', email: 'bich.tran@example.com', phone: '0922222222', address: { fullName: 'Trần Thị Bích', phone: '0922222222', province: 'TP. Hồ Chí Minh', district: 'Quận 3', ward: 'Phường 6', addressLine: '45 Võ Văn Tần' } },
    { name: 'Lê Minh Châu', email: 'chau.le@example.com', phone: '0933333333', address: { fullName: 'Lê Minh Châu', phone: '0933333333', province: 'Hà Nội', district: 'Ba Đình', ward: 'Phường Điện Biên', addressLine: '8 Điện Biên Phủ' } },
  ]
  for (const c of sampleCustomers) {
    const user = await prisma.user.create({
      data: {
        name: c.name,
        email: c.email,
        phone: c.phone,
        role: 'CUSTOMER',
        passwordHash: await bcrypt.hash('Customer@123', BCRYPT_ROUNDS),
      },
    })
    await prisma.address.create({ data: { ...c.address, userId: user.id, isDefault: true } })
  }

  console.log('Seed complete:')
  console.log(`  - ${categorySeeds.length} categories`)
  console.log(`  - ${productSeeds.length} products`)
  console.log('  - 1 admin (admin@fiship.vn / Admin@123456)')
  console.log(`  - ${sampleCustomers.length} customers (password: Customer@123)`)
}

main()
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
