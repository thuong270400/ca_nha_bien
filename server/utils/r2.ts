import { S3Client } from '@aws-sdk/client-s3'

const globalForR2 = globalThis as unknown as { r2Client?: S3Client }

function createR2Client() {
  const endpoint = process.env.R2_ENDPOINT
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing R2_ENDPOINT / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY env vars')
  }
  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  })
}

export const r2Client = globalForR2.r2Client ?? createR2Client()

if (process.env.NODE_ENV !== 'production') {
  globalForR2.r2Client = r2Client
}

export const r2Bucket = process.env.R2_BUCKET_NAME || 'ca-nha-bien-images'
