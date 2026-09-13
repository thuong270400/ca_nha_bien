import { Errors } from '../utils/errors'
import { prisma } from '../utils/prisma'
import type { CategoryCreateInput, CategoryUpdateInput } from '../utils/schemas/category.schema'
import { activeProductWhere, productInclude } from './product.service'

export async function listCategories(activeOnly?: boolean) {
  return prisma.category.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: [{ position: 'asc' }, { name: 'asc' }],
  })
}

/**
 * Featured categories for the landing page, each with its own products —
 * capped at `homepageLimit` (null = show every product in that category).
 * `hasMore` tells the frontend whether to render a "Xem tất cả" button.
 */
export async function getHomepageCategorySections() {
  const categories = await prisma.category.findMany({
    where: { isActive: true, isFeatured: true },
    orderBy: [{ position: 'asc' }, { name: 'asc' }],
  })

  return Promise.all(categories.map(async (category) => {
    const where = { ...activeProductWhere, categories: { some: { id: category.id } } }
    const limit = category.homepageLimit ?? undefined

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: productInclude,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      limit !== undefined ? prisma.product.count({ where }) : Promise.resolve(0),
    ])

    return { ...category, products, hasMore: limit !== undefined && total > limit }
  }))
}

export async function getCategoryById(id: string) {
  const category = await prisma.category.findUnique({ where: { id } })
  if (!category) throw Errors.notFound('Không tìm thấy danh mục')
  return category
}

export async function getCategoryBySlug(slug: string, opts: { includeInactive?: boolean } = {}) {
  const category = await prisma.category.findFirst({
    where: { slug, ...(opts.includeInactive ? {} : { isActive: true }) },
  })
  if (!category) throw Errors.notFound('Không tìm thấy danh mục')
  return category
}

async function assertSlugAvailable(slug: string, excludeId?: string) {
  const existing = await prisma.category.findUnique({ where: { slug } })
  if (existing && existing.id !== excludeId) {
    throw Errors.conflict('Slug danh mục đã tồn tại')
  }
}

export async function createCategory(input: CategoryCreateInput) {
  await assertSlugAvailable(input.slug)
  return prisma.category.create({ data: input })
}

export async function updateCategory(id: string, input: CategoryUpdateInput) {
  await getCategoryById(id)
  if (input.slug) await assertSlugAvailable(input.slug, id)
  return prisma.category.update({ where: { id }, data: input })
}

export async function deleteCategory(id: string) {
  await getCategoryById(id)
  // A soft-deleted product row still references the category via the join
  // table, so it must be counted too or the delete below could leave it
  // dangling on the product's category list.
  const productCount = await prisma.product.count({ where: { categories: { some: { id } } } })
  if (productCount > 0) {
    throw Errors.badRequest('Không thể xoá danh mục đang có sản phẩm (kể cả sản phẩm đã ẩn)')
  }
  await prisma.category.delete({ where: { id } })
}
