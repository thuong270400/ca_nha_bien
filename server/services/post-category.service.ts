import { Errors } from '../utils/errors'
import { prisma } from '../utils/prisma'
import type { PostCategoryCreateInput, PostCategoryUpdateInput } from '../utils/schemas/post-category.schema'
import { deleteImage } from './upload.service'

/**
 * activeOnly (storefront "Góc Biển"): hidden categories are excluded and postCount only
 * counts published posts. Admin (activeOnly false): everything, counting drafts too.
 */
export async function listPostCategories(activeOnly?: boolean) {
  const categories = await prisma.postCategory.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: [{ position: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { posts: activeOnly ? { where: { isPublished: true } } : true } } },
  })
  return categories.map(({ _count, ...c }) => ({ ...c, postCount: _count.posts }))
}

export async function getActivePostCategoryBySlug(slug: string) {
  const category = await prisma.postCategory.findFirst({ where: { slug, isActive: true } })
  if (!category) throw Errors.notFound('Không tìm thấy danh mục bài viết')
  return category
}

export async function getPostCategoryById(id: string) {
  const category = await prisma.postCategory.findUnique({ where: { id } })
  if (!category) throw Errors.notFound('Không tìm thấy danh mục bài viết')
  return category
}

async function assertSlugAvailable(slug: string, excludeId?: string) {
  const existing = await prisma.postCategory.findUnique({ where: { slug } })
  if (existing && existing.id !== excludeId) {
    throw Errors.conflict('Slug danh mục bài viết đã tồn tại')
  }
}

function emptyToNull(value: string | null | undefined) {
  return value === undefined ? undefined : (value || null)
}

export async function createPostCategory(input: PostCategoryCreateInput) {
  await assertSlugAvailable(input.slug)
  return prisma.postCategory.create({
    data: { ...input, description: emptyToNull(input.description), imageUrl: emptyToNull(input.imageUrl) },
  })
}

export async function updatePostCategory(id: string, input: PostCategoryUpdateInput) {
  const existing = await getPostCategoryById(id)
  if (input.slug) await assertSlugAvailable(input.slug, id)
  const category = await prisma.postCategory.update({
    where: { id },
    data: { ...input, description: emptyToNull(input.description), imageUrl: emptyToNull(input.imageUrl) },
  })
  if (existing.imageUrl && existing.imageUrl !== category.imageUrl) await deleteImage(existing.imageUrl)
  return category
}

export async function deletePostCategory(id: string) {
  await getPostCategoryById(id)
  const postCount = await prisma.post.count({ where: { categoryId: id } })
  if (postCount > 0) {
    throw Errors.badRequest('Không thể xoá danh mục đang có bài viết — hãy chuyển các bài viết sang danh mục khác trước')
  }
  const deleted = await prisma.postCategory.delete({ where: { id } })
  await deleteImage(deleted.imageUrl)
}
