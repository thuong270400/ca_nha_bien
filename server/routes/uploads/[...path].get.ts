import type { Readable } from 'node:stream'
import { GetObjectCommand, S3ServiceException } from '@aws-sdk/client-s3'
import { r2Bucket, r2Client } from '../../utils/r2'

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
}

function toSafeKey(requestedPath: string): string | null {
  const segments = requestedPath.split('/').filter(seg => seg && seg !== '.' && seg !== '..')
  return segments.length ? segments.join('/') : null
}

export default defineEventHandler(async (event) => {
  const requestedPath = getRouterParam(event, 'path') || ''
  const key = toSafeKey(requestedPath)
  if (!key) {
    throw createError({ statusCode: 400, message: 'Đường dẫn không hợp lệ' })
  }

  let object
  try {
    object = await r2Client.send(new GetObjectCommand({ Bucket: r2Bucket, Key: key }))
  } catch (err) {
    if (err instanceof S3ServiceException && (err.name === 'NoSuchKey' || err.$metadata.httpStatusCode === 404)) {
      throw createError({ statusCode: 404, message: 'Không tìm thấy file' })
    }
    throw err
  }

  const ext = key.slice(key.lastIndexOf('.')).toLowerCase()
  setHeader(event, 'Content-Type', object.ContentType || MIME_TYPES[ext] || 'application/octet-stream')
  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  return sendStream(event, object.Body as Readable)
})
