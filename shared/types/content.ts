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
