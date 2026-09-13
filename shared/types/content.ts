export type PostType = 'NEWS' | 'RECIPE'

export interface Post {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  coverImageUrl: string | null
  type: PostType
  isPublished: boolean
  publishedAt: string | null
  createdAt: string
}

export interface Banner {
  id: string
  imageUrl: string
  title: string | null
  subtitle: string | null
  ctaLabel: string | null
  ctaLink: string | null
  position: number
  isActive: boolean
}

/** Iconify (simple-icons) presets offered in the admin icon picker — no extra npm dependency needed. */
export const SOCIAL_ICON_PRESETS = [
  { key: 'facebook', label: 'Facebook', icon: 'i-simple-icons-facebook' },
  { key: 'instagram', label: 'Instagram', icon: 'i-simple-icons-instagram' },
  { key: 'threads', label: 'Threads', icon: 'i-simple-icons-threads' },
  { key: 'tiktok', label: 'TikTok', icon: 'i-simple-icons-tiktok' },
  { key: 'messenger', label: 'Messenger', icon: 'i-simple-icons-messenger' },
  { key: 'zalo', label: 'Zalo', icon: 'i-simple-icons-zalo' },
  { key: 'youtube', label: 'YouTube', icon: 'i-simple-icons-youtube' },
  { key: 'telegram', label: 'Telegram', icon: 'i-simple-icons-telegram' },
  { key: 'shopee', label: 'Shopee', icon: 'i-simple-icons-shopee' },
] as const

export type SocialLinkIconType = 'PRESET' | 'CUSTOM'
export type SocialLinkDisplay = 'FOOTER' | 'FIXED'

export interface SocialLink {
  id: string
  label: string | null
  url: string
  iconType: SocialLinkIconType
  iconKey: string | null
  imageUrl: string | null
  /** FOOTER: shown in the storefront footer row (default). FIXED: floating button on the right edge of every page. */
  displayLocation: SocialLinkDisplay
  position: number
  isActive: boolean
}
