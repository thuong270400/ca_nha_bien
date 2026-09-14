import { Errors } from '../utils/errors'
import { prisma } from '../utils/prisma'
import type { CouponCategoryCreateInput, CouponCategoryUpdateInput } from '../utils/schemas/coupon-category.schema'

export async function listCouponCategories(activeOnly?: boolean) {
  return prisma.couponCategory.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: [{ position: 'asc' }, { name: 'asc' }],
  })
}

export async function getCouponCategoryById(id: string) {
  const category = await prisma.couponCategory.findUnique({ where: { id } })
  if (!category) throw Errors.notFound('Không tìm thấy danh mục mã giảm giá')
  return category
}

async function assertSlugAvailable(slug: string, excludeId?: string) {
  const existing = await prisma.couponCategory.findUnique({ where: { slug } })
  if (existing && existing.id !== excludeId) {
    throw Errors.conflict('Slug danh mục mã giảm giá đã tồn tại')
  }
}

export async function createCouponCategory(input: CouponCategoryCreateInput) {
  await assertSlugAvailable(input.slug)
  return prisma.couponCategory.create({ data: input })
}

export async function updateCouponCategory(id: string, input: CouponCategoryUpdateInput) {
  await getCouponCategoryById(id)
  if (input.slug) await assertSlugAvailable(input.slug, id)
  return prisma.couponCategory.update({ where: { id }, data: input })
}

export async function deleteCouponCategory(id: string) {
  await getCouponCategoryById(id)
  const couponCount = await prisma.coupon.count({ where: { categoryId: id } })
  if (couponCount > 0) {
    throw Errors.badRequest('Không thể xoá danh mục đang có mã giảm giá — hãy xoá hoặc chuyển các mã sang danh mục khác trước')
  }
  await prisma.couponCategory.delete({ where: { id } })
}
