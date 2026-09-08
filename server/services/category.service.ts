import { Errors } from '../utils/errors'
import { prisma } from '../utils/prisma'
import type { CategoryCreateInput, CategoryUpdateInput } from '../utils/schemas/category.schema'

export async function listCategories(activeOnly?: boolean) {
  return prisma.category.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: [{ position: 'asc' }, { name: 'asc' }],
  })
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
  // Product.categoryId is a required FK (Restrict) — a soft-deleted product row still
  // references the category, so it must be counted too or the delete below would 500.
  const productCount = await prisma.product.count({ where: { categoryId: id } })
  if (productCount > 0) {
    throw Errors.badRequest('Không thể xoá danh mục đang có sản phẩm (kể cả sản phẩm đã ẩn)')
  }
  await prisma.category.delete({ where: { id } })
}
