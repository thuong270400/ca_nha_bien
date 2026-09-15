export type SuggestedDishVideoType = 'YOUTUBE' | 'MP4' | 'OTHER'

const YOUTUBE_RE = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i

/** Classifies a suggested-dish video URL — stored on `SuggestedDish.videoType` at save time. */
export function detectVideoType(url: string): SuggestedDishVideoType {
  if (YOUTUBE_RE.test(url)) return 'YOUTUBE'
  if (/\.(mp4|webm|ogg)(?:\?.*)?$/i.test(url)) return 'MP4'
  return 'OTHER'
}

/** Builds an embeddable `/embed/...` URL from any YouTube watch/short/embed link, or null if it doesn't match. */
export function getYoutubeEmbedUrl(url: string): string | null {
  const match = YOUTUBE_RE.exec(url)
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}
