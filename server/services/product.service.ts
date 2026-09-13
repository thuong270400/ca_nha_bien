import { Prisma } from '../generated/prisma/client'
import { Errors } from '../utils/errors'
import { prisma } from '../utils/prisma'
import type { ProductCreateInput, ProductListQuery, ProductUpdateInput } from '../utils/schemas/product.schema'
import { deleteImage } from './upload.service'

export const productInclude = {
  categories: true,
  images: { orderBy: { position: 'asc' as const } },
  variants: { orderBy: { price: 'asc' as const } },
  tags: true,
} satisfies Prisma.ProductInclude

type IncomingVariant = ProductCreateInput['variants'][number]

function pickDefaultVariant<T extends { price: number | Prisma.Decimal, isDefault?: boolean }>(variants: T[]): T {
  const marked = variants.find(v => v.isDefault)
  if (marked) return marked
  return [...variants].sort((a, b) => Number(a.price) - Number(b.price))[0]!
}

async function assertSlugAvailable(slug: string, excludeId?: string) {
  const existing = await prisma.product.findUnique({ where: { slug } })
  if (existing && existing.id !== excludeId) {
    throw Errors.conflict('Slug sản phẩm đã tồn tại')
  }
}

export async function listProducts(query: ProductListQuery, opts: { includeInactive?: boolean } = {}) {
  const where: Prisma.ProductWhereInput = {
    deletedAt: opts.includeInactive ? undefined : null,
    status: opts.includeInactive ? query.status : 'ACTIVE',
  }

  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: 'insensitive' } },
      { description: { contains: query.q, mode: 'insensitive' } },
    ]
  }
  if (query.category) {
    where.categories = { some: { slug: query.category } }
  }
  if (query.featured !== undefined) {
    where.isFeatured = query.featured
  }
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.price = {
      ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
      ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
    }
  }
  const variantWhere: Prisma.ProductVariantWhereInput = {}
  if (query.inStock) variantWhere.stock = { gt: 0 }
  if (query.unit) {
    const units = query.unit.split(',').map(u => u.trim()).filter(Boolean)
    if (units.length) variantWhere.unit = { in: units }
  }
  if (Object.keys(variantWhere).length) {
    where.variants = { some: variantWhere }
  }

  if (query.tags) {
    const tagSlugs = query.tags.split(',').map(t => t.trim()).filter(Boolean)
    if (tagSlugs.length) where.tags = { some: { slug: { in: tagSlugs } } }
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput
    = query.sort === 'price_asc'
      ? { price: 'asc' }
      : query.sort === 'price_desc'
        ? { price: 'desc' }
        : query.sort === 'name_asc'
          ? { name: 'asc' }
          : query.sort === 'best_selling'
            ? { soldCount: 'desc' }
            : { createdAt: 'desc' }

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: productInclude,
    }),
    prisma.product.count({ where }),
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

export async function getProductById(id: string, opts: { includeInactive?: boolean } = {}) {
  const product = await prisma.product.findFirst({
    where: { id, ...(opts.includeInactive ? {} : { deletedAt: null, status: 'ACTIVE' }) },
    include: productInclude,
  })
  if (!product) throw Errors.notFound('Không tìm thấy sản phẩm')
  return product
}

export async function getProductBySlug(slug: string, opts: { includeInactive?: boolean } = {}) {
  const product = await prisma.product.findFirst({
    where: { slug, ...(opts.includeInactive ? {} : { deletedAt: null, status: 'ACTIVE' }) },
    include: productInclude,
  })
  if (!product) throw Errors.notFound('Không tìm thấy sản phẩm')
  return product
}

export async function getRelatedProducts(productId: string, categoryIds: string[], limit = 8) {
  if (!categoryIds.length) return []
  return prisma.product.findMany({
    where: { id: { not: productId }, categories: { some: { id: { in: categoryIds } } }, deletedAt: null, status: 'ACTIVE' },
    include: productInclude,
    take: limit,
    orderBy: { createdAt: 'desc' },
  })
}

export const activeProductWhere = { deletedAt: null, status: 'ACTIVE' } satisfies Prisma.ProductWhereInput

export async function getOnSaleProducts(limit = 8) {
  return prisma.product.findMany({
    where: { ...activeProductWhere, compareAtPrice: { not: null } },
    include: productInclude,
    take: limit,
    orderBy: { updatedAt: 'desc' },
  })
}

export async function getFeaturedProducts(limit = 8) {
  return prisma.product.findMany({
    where: { ...activeProductWhere, isFeatured: true },
    include: productInclude,
    take: limit,
    orderBy: { createdAt: 'desc' },
  })
}

export async function getDistinctUnits(categorySlug?: string) {
  const rows = await prisma.productVariant.findMany({
    where: { product: { ...activeProductWhere, ...(categorySlug ? { categories: { some: { slug: categorySlug } } } : {}) } },
    distinct: ['unit'],
    select: { unit: true },
    orderBy: { unit: 'asc' },
  })
  return rows.map(r => r.unit)
}

export async function suggestProducts(q: string, limit = 8) {
  const products = await prisma.product.findMany({
    where: { deletedAt: null, status: 'ACTIVE', name: { contains: q, mode: 'insensitive' } },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      images: { take: 1, orderBy: { position: 'asc' }, select: { url: true } },
    },
    orderBy: { soldCount: 'desc' },
    take: limit,
  })
  return products.map(p => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price?.toString() ?? null,
    imageUrl: p.images[0]?.url ?? null,
  }))
}

export async function createProduct(input: ProductCreateInput) {
  await assertSlugAvailable(input.slug)
  const defaultVariant = pickDefaultVariant(input.variants)

  return prisma.$transaction(async (tx) => {
    return tx.product.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        origin: input.origin,
        status: input.status ?? 'ACTIVE',
        isFeatured: input.isFeatured ?? false,
        categories: { connect: input.categoryIds.map(id => ({ id })) },
        price: defaultVariant.price,
        compareAtPrice: defaultVariant.compareAtPrice,
        images: input.images?.length
          ? { create: input.images.map((img, idx) => ({ url: img.url, alt: img.alt, position: img.position ?? idx })) }
          : undefined,
        variants: {
          create: input.variants.map(v => ({
            unit: v.unit,
            price: v.price,
            compareAtPrice: v.compareAtPrice,
            stock: v.stock,
            sku: v.sku,
            isDefault: v === defaultVariant,
          })),
        },
        tags: input.tagIds?.length ? { connect: input.tagIds.map(id => ({ id })) } : undefined,
      },
      include: productInclude,
    })
  })
}

export async function updateProduct(id: string, input: ProductUpdateInput) {
  await getProductById(id, { includeInactive: true })
  if (input.slug) await assertSlugAvailable(input.slug, id)

  const { product, removedImageUrls } = await prisma.$transaction(async (tx) => {
    if (input.variants) await syncVariants(tx, id, input.variants)
    const removedImageUrls = input.images ? await syncImages(tx, id, input.images) : []

    const variants = await tx.productVariant.findMany({ where: { productId: id } })
    if (variants.length === 0) {
      throw Errors.badRequest('Sản phẩm cần có ít nhất 1 biến thể (đơn vị bán)')
    }

    const defaultVariant = pickDefaultVariant(variants)
    await tx.productVariant.updateMany({ where: { productId: id }, data: { isDefault: false } })
    await tx.productVariant.update({ where: { id: defaultVariant.id }, data: { isDefault: true } })

    const product = await tx.product.update({
      where: { id },
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        origin: input.origin,
        status: input.status,
        deletedAt: input.status === 'ACTIVE' ? null : undefined,
        isFeatured: input.isFeatured,
        categories: input.categoryIds ? { set: input.categoryIds.map(id => ({ id })) } : undefined,
        price: defaultVariant.price,
        compareAtPrice: defaultVariant.compareAtPrice,
        tags: input.tagIds ? { set: input.tagIds.map(tagId => ({ id: tagId })) } : undefined,
      },
      include: productInclude,
    })

    return { product, removedImageUrls }
  })

  await Promise.all(removedImageUrls.map(url => deleteImage(url)))
  return product
}

export async function deleteProduct(id: string) {
  await getProductById(id, { includeInactive: true })
  await prisma.product.update({ where: { id }, data: { deletedAt: new Date(), status: 'INACTIVE' } })
}

export async function hardDeleteProduct(id: string) {
  const product = await getProductById(id, { includeInactive: true })
  if (!product.deletedAt) {
    throw Errors.badRequest('Chỉ có thể xoá vĩnh viễn sản phẩm đã được ẩn trước đó')
  }

  try {
    await prisma.product.delete({ where: { id } })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      throw Errors.conflict('Không thể xoá vĩnh viễn sản phẩm đã phát sinh trong đơn hàng')
    }
    throw err
  }

  await Promise.all(product.images.map(img => deleteImage(img.url)))
}

async function syncVariants(tx: Prisma.TransactionClient, productId: string, variants: IncomingVariant[]) {
  const current = await tx.productVariant.findMany({ where: { productId }, select: { id: true } })
  const incomingIds = new Set(variants.filter(v => v.id).map(v => v.id))
  const toDelete = current.filter(v => !incomingIds.has(v.id))

  for (const variant of toDelete) {
    try {
      await tx.productVariant.delete({ where: { id: variant.id } })
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        throw Errors.conflict('Không thể xoá biến thể đã phát sinh trong đơn hàng — hãy đặt tồn kho về 0 thay vì xoá')
      }
      throw err
    }
  }

  for (const variant of variants) {
    const data = {
      unit: variant.unit,
      price: variant.price,
      compareAtPrice: variant.compareAtPrice ?? null,
      stock: variant.stock,
      sku: variant.sku,
    }
    if (variant.id) {
      await tx.productVariant.update({ where: { id: variant.id }, data })
    } else {
      await tx.productVariant.create({ data: { ...data, productId } })
    }
  }
}

async function syncImages(tx: Prisma.TransactionClient, productId: string, images: NonNullable<ProductUpdateInput['images']>) {
  const keepIds = images.filter(i => i.id).map(i => i.id as string)
  const removed = await tx.productImage.findMany({ where: { productId, id: { notIn: keepIds } }, select: { url: true } })
  await tx.productImage.deleteMany({ where: { productId, id: { notIn: keepIds } } })

  for (const [idx, image] of images.entries()) {
    const data = { url: image.url, alt: image.alt, position: image.position ?? idx }
    if (image.id) {
      await tx.productImage.update({ where: { id: image.id }, data })
    } else {
      await tx.productImage.create({ data: { ...data, productId } })
    }
  }

  return removed.map(r => r.url)
}
