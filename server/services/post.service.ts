import type { Prisma } from '../generated/prisma/client'
import { extractUploadImageUrls, postPlainText, toPostHtml } from '../../shared/utils/post-content'
import { Errors } from '../utils/errors'
import { prisma } from '../utils/prisma'
import { sanitizePostHtml } from '../utils/sanitize-post'
import type { PostAdminListQuery, PostCreateInput, PostListQuery, PostUpdateInput } from '../utils/schemas/post.schema'
import { deleteImage } from './upload.service'

const categorySelect = { select: { id: true, name: true, slug: true } } as const

function searchWhere(q: string | undefined): Prisma.PostWhereInput {
  if (!q) return {}
  return {
    OR: [
      { title: { contains: q, mode: 'insensitive' } },
      { excerpt: { contains: q, mode: 'insensitive' } },
      { slug: { contains: q, mode: 'insensitive' } },
    ],
  }
}

async function assertCategoryExists(categoryId: string | null | undefined) {
  if (!categoryId) return
  const category = await prisma.postCategory.findUnique({ where: { id: categoryId } })
  if (!category) throw Errors.badRequest('Danh mục bài viết không tồn tại')
}

async function assertSlugAvailable(slug: string, excludeId?: string) {
  const existing = await prisma.post.findUnique({ where: { slug } })
  if (existing && existing.id !== excludeId) {
    throw Errors.conflict('Slug bài viết đã tồn tại')
  }
}

/** Sanitizes editor HTML (or wraps legacy plain text) and rejects content that is empty once tags are stripped, e.g. "<p></p>". */
function normalizeContent(content: string): string {
  const html = sanitizePostHtml(toPostHtml(content))
  if (!postPlainText(html) && !/<img\b/i.test(html)) {
    throw Errors.badRequest('Nội dung không được để trống')
  }
  return html
}

/** "" and null both mean "cleared"; undefined means "not sent" (left untouched on update). */
function emptyToNull(value: string | null | undefined) {
  return value === undefined ? undefined : (value || null)
}

/** Best-effort R2 cleanup for images the post referenced before but no longer does (cover + inline content images). */
async function deleteUnusedImages(before: string[], after: string[]) {
  const keep = new Set(after)
  await Promise.all(before.filter(url => !keep.has(url)).map(url => deleteImage(url)))
}

function postImages(post: { coverImageUrl: string | null, content: string }) {
  return [...(post.coverImageUrl ? [post.coverImageUrl] : []), ...extractUploadImageUrls(post.content)]
}

export async function listPosts(query: PostListQuery) {
  const where: Prisma.PostWhereInput = {
    isPublished: true,
    ...(query.type ? { type: query.type } : {}),
    // a hidden category hides its listing page too, not just the category card
    ...(query.category ? { category: { slug: query.category, isActive: true } } : {}),
    ...searchWhere(query.q),
  }
  const [data, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      omit: { content: true },
      include: { category: categorySelect },
    }),
    prisma.post.count({ where }),
  ])
  return { data, meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } }
}

export async function getPublishedPostBySlug(slug: string) {
  const post = await prisma.post.findFirst({
    where: { slug, isPublished: true },
    include: { category: { select: { id: true, name: true, slug: true, isActive: true } } },
  })
  if (!post) throw Errors.notFound('Không tìm thấy bài viết')
  return post
}

export async function listAllPosts(query: PostAdminListQuery) {
  const where: Prisma.PostWhereInput = {
    ...(query.type ? { type: query.type } : {}),
    ...(query.isPublished !== undefined ? { isPublished: query.isPublished } : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...searchWhere(query.q),
  }
  const [data, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      // the list table never shows the body — skip shipping every post's full HTML
      omit: { content: true },
      include: { category: categorySelect },
    }),
    prisma.post.count({ where }),
  ])
  return { data, meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } }
}

export async function getPostById(id: string) {
  const post = await prisma.post.findUnique({ where: { id } })
  if (!post) throw Errors.notFound('Không tìm thấy bài viết')
  return post
}

export async function createPost(input: PostCreateInput) {
  await assertSlugAvailable(input.slug)
  await assertCategoryExists(input.categoryId)
  return prisma.post.create({
    data: {
      ...input,
      excerpt: emptyToNull(input.excerpt),
      coverImageUrl: emptyToNull(input.coverImageUrl),
      content: normalizeContent(input.content),
      publishedAt: input.isPublished ? new Date() : null,
    },
  })
}

export async function updatePost(id: string, input: PostUpdateInput) {
  const existing = await getPostById(id)
  if (input.slug) await assertSlugAvailable(input.slug, id)
  await assertCategoryExists(input.categoryId)

  // publishedAt marks the first time a post went live and stays put across
  // unpublish/republish, so re-publishing a fixed-up post doesn't bump it to the top of /blog.
  const publishedAt = input.isPublished && !existing.publishedAt ? new Date() : undefined

  const post = await prisma.post.update({
    where: { id },
    data: {
      ...input,
      excerpt: emptyToNull(input.excerpt),
      coverImageUrl: emptyToNull(input.coverImageUrl),
      content: input.content !== undefined ? normalizeContent(input.content) : undefined,
      ...(publishedAt ? { publishedAt } : {}),
    },
  })
  await deleteUnusedImages(postImages(existing), postImages(post))
  return post
}

export async function deletePost(id: string) {
  const existing = await getPostById(id)
  await prisma.post.delete({ where: { id } })
  await deleteUnusedImages(postImages(existing), [])
}
