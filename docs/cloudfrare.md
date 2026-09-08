## Cloudflare R2

Permissions: read/write/list objects in the bucket below.

Bucket: ca-nha-bien-images
Endpoint (S3 API, jurisdiction-specific): https://4d549c662ebb38a21350acda0b37c067.r2.cloudflarestorage.com

The Token / Access Key ID / Secret Access Key live in `.env` (gitignored) as
`R2_ENDPOINT` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME`
— see `.env.example` for the shape. Do not paste the raw credentials back into
this file: `docs/` is committed to git and this repo has no `.env` history yet
to worry about, but this file does.

Used by `server/utils/r2.ts` (S3 client) and `server/services/upload.service.ts`
(save/delete). Reads are proxied through `GET /uploads/[...path]`
(`server/routes/uploads/[...path].get.ts`) rather than served directly from R2,
so the bucket can stay private with no public access / custom domain needed.
