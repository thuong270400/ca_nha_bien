/**
 * Post.content is HTML written by the admin rich-text editor (UEditor/Tiptap) and
 * sanitized server-side on save (server/utils/sanitize-post.ts). Posts created before
 * the editor existed hold plain text instead — this tells the two apart so both the
 * editor and the storefront can treat old posts as HTML without a data migration.
 */
export function isHtmlContent(content: string): boolean {
  return /^\s*<[a-z][\s\S]*>/i.test(content)
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Legacy plain text → paragraphs (blank line) and <br> (single newline), matching how it used to render. */
export function toPostHtml(content: string): string {
  if (isHtmlContent(content)) return content
  return content
    .split(/\n{2,}/)
    .map(block => block.trim())
    .filter(Boolean)
    .map(block => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

/** Every `/uploads/...` image referenced by an <img> in the content — used to clean up R2 objects the content no longer uses. */
export function extractUploadImageUrls(content: string | null | undefined): string[] {
  if (!content) return []
  const urls = new Set<string>()
  for (const match of content.matchAll(/<img\b[^>]*\bsrc="(\/uploads\/[^"]+)"/gi)) urls.add(match[1]!)
  return [...urls]
}

/** Plain text of the content (tags stripped), e.g. for a fallback excerpt or an "is it empty" check. */
export function postPlainText(content: string): string {
  return content
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|h[1-6]|li|blockquote)>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Storefront URL of a post — news lives under /blog, recipes under /recipes. */
export function postPublicPath(post: { type: 'NEWS' | 'RECIPE', slug: string }): string {
  return post.type === 'RECIPE' ? `/recipes/${post.slug}` : `/blog/${post.slug}`
}
