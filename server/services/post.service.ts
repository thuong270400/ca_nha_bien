import { Errors } from '../utils/errors'
import { prisma } from '../utils/prisma'
import type { PostCreateInput, PostUpdateInput } from '../utils/schemas/post.schema'
import { deleteImage } from './upload.service'

interface PostListQuery {
  page: number
  limit: number
  type?: 'NEWS' | 'RECIPE'
}

interface PostAdminListQuery extends PostListQuery {
  isPublished?: boolean
}

async function assertSlugAvailable(slug: string, excludeId?: string) {
  const existing = await prisma.post.findUnique({ where: { slug } })
  if (existing && existing.id !== excludeId) {
    throw Errors.conflict('Slug bài viết đã tồn tại')
  }
}

export async function listPosts(query: PostListQuery) {
  const where = { isPublished: true, ...(query.type ? { type: query.type } : {}) }
  const [data, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.post.count({ where }),
  ])
  return { data, meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } }
}

export async function getPublishedPostBySlug(slug: string) {
  const post = await prisma.post.findFirst({ where: { slug, isPublished: true } })
  if (!post) throw Errors.notFound('Không tìm thấy bài viết')
  return post
}

export async function listAllPosts(query: PostAdminListQuery) {
  const where = {
    ...(query.type ? { type: query.type } : {}),
    ...(query.isPublished !== undefined ? { isPublished: query.isPublished } : {}),
  }
  const [data, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
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
  return prisma.post.create({
    data: { ...input, publishedAt: input.isPublished ? new Date() : null },
  })
}

export async function updatePost(id: string, input: PostUpdateInput) {
  const existing = await getPostById(id)
  if (input.slug) await assertSlugAvailable(input.slug, id)

  const publishedAt = input.isPublished && !existing.isPublished ? new Date() : undefined

  const post = await prisma.post.update({
    where: { id },
    data: { ...input, ...(publishedAt ? { publishedAt } : {}) },
  })
  if (input.coverImageUrl && input.coverImageUrl !== existing.coverImageUrl) await deleteImage(existing.coverImageUrl)
  return post
}

export async function deletePost(id: string) {
  const existing = await getPostById(id)
  await prisma.post.delete({ where: { id } })
  await deleteImage(existing.coverImageUrl)
}
