import { randomUUID } from 'node:crypto'
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { Errors } from '../utils/errors'
import { r2Bucket, r2Client } from '../utils/r2'

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
}
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

interface UploadedFile {
  type?: string
  filename?: string
  data: Buffer
}

export const UPLOAD_FOLDERS = ['products', 'posts', 'banners'] as const
export type UploadFolder = typeof UPLOAD_FOLDERS[number]

/**
 * Images live in a private Cloudflare R2 bucket (see server/utils/r2.ts) and are
 * proxied back through GET /uploads/[...path] (server/routes/uploads/[...path].get.ts)
 * rather than served directly from R2 — this avoids needing public bucket access or a
 * custom domain, and keeps the R2 credentials server-side only. The object key is the
 * same "<folder>/<filename>" both here and in that route, so a stored url like
 * "/uploads/products/xxxx.jpg" maps directly to R2 key "products/xxxx.jpg".
 */
function keyToUrl(key: string) {
  return `/uploads/${key}`
}

function urlToKey(url: string): string | null {
  const match = /^\/uploads\/(.+)$/.exec(url)
  return match ? match[1]! : null
}

/** Strips the extension and diacritics from an uploaded filename, e.g. "Mực Ống.jpg" -> "muc-ong". */
function slugifyFilename(name: string): string {
  return name
    .replace(/\.[^./]+$/, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export async function saveImage(file: UploadedFile, folder: UploadFolder) {
  const ext = ALLOWED_TYPES[file.type ?? '']
  if (!ext) throw Errors.badRequest('Chỉ chấp nhận ảnh định dạng JPEG, PNG, WEBP, GIF hoặc SVG')
  if (file.data.length > MAX_SIZE) throw Errors.badRequest('Kích thước ảnh không được vượt quá 5MB')

  // Keep the original filename readable in the R2 dashboard, with a short random
  // suffix so two uploads named the same (e.g. two different products' "ca-thu.jpg")
  // never collide/overwrite each other.
  const slug = slugifyFilename(file.filename ?? '')
  const suffix = randomUUID().slice(0, 8)
  const filename = slug ? `${slug}-${suffix}.${ext}` : `${suffix}.${ext}`
  const key = `${folder}/${filename}`
  await r2Client.send(new PutObjectCommand({
    Bucket: r2Bucket,
    Key: key,
    Body: file.data,
    ContentType: file.type,
  }))

  return { url: keyToUrl(key) }
}

/**
 * Best-effort cleanup: callers already committed the DB change that drops the
 * reference to this url before calling this, so a failure here just leaves an
 * orphaned object in R2 rather than corrupting any state.
 */
export async function deleteImage(url: string | null | undefined) {
  const key = url ? urlToKey(url) : null
  if (!key) return
  try {
    await r2Client.send(new DeleteObjectCommand({ Bucket: r2Bucket, Key: key }))
  } catch (err) {
    console.error(`Failed to delete R2 object for ${url}:`, err)
  }
}
