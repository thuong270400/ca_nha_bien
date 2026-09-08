// One-off migration: uploads the local files under uploads/ (written before this
// project moved image storage to Cloudflare R2 — see server/utils/r2.ts) to the R2
// bucket, using the same "<folder>/<filename>" key so existing DB rows that store
// urls like "/uploads/products/xxxx.jpg" (product_images.url, banners.imageUrl,
// posts.coverImageUrl) keep working unchanged against the new
// GET /uploads/[...path] proxy route.
//
// Dry run (default, lists what would upload):
//   npx tsx scripts/migrate-uploads-to-r2.ts
// Apply for real:
//   npx tsx scripts/migrate-uploads-to-r2.ts --apply
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import 'dotenv/config'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { UPLOAD_FOLDERS } from '../server/services/upload.service'
import { r2Bucket, r2Client } from '../server/utils/r2'

const APPLY = process.argv.includes('--apply')
const UPLOAD_ROOT = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads')

const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
}

async function main() {
  console.log(APPLY ? 'Uploading to R2 (writes will be applied)...' : 'Dry run — no uploads will be made. Pass --apply to execute.')

  for (const folder of UPLOAD_FOLDERS) {
    const dir = path.join(UPLOAD_ROOT, folder)
    let files: string[]
    try {
      files = await readdir(dir)
    } catch {
      console.log(`  "${folder}": no local directory, skipping`)
      continue
    }

    for (const filename of files) {
      const key = `${folder}/${filename}`
      const ext = path.extname(filename).toLowerCase()
      const contentType = CONTENT_TYPES[ext] || 'application/octet-stream'
      console.log(`  ${key} (${contentType})`)
      if (APPLY) {
        const data = await readFile(path.join(dir, filename))
        await r2Client.send(new PutObjectCommand({ Bucket: r2Bucket, Key: key, Body: data, ContentType: contentType }))
      }
    }
  }

  console.log(APPLY ? '\nDone.' : '\nDry run complete — re-run with --apply to execute the plan above.')
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
