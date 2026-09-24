import sanitizeHtml from 'sanitize-html'

/**
 * Allowlist matching what the admin editor (UEditor's Tiptap starter kit + image) can
 * produce. The storefront renders Post.content with v-html, so anything outside this
 * list — scripts, inline handlers, style attributes, iframes — is stripped on save.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'strong', 'b', 'em', 'i', 'u', 's', 'code', 'pre',
    'blockquote', 'ul', 'ol', 'li', 'a', 'img', 'hr',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    ol: ['start'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  allowProtocolRelative: false,
  // an <img> whose src was stripped (e.g. javascript:) is just an empty box — drop it
  exclusiveFilter: frame => frame.tag === 'img' && !frame.attribs.src,
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: attribs.target === '_blank'
        ? { ...attribs, rel: 'noopener noreferrer nofollow' }
        : attribs,
    }),
  },
}

export function sanitizePostHtml(html: string): string {
  return sanitizeHtml(html, OPTIONS).trim()
}
