export interface ReviewView {
  id: string
  productId: string
  userId: string
  orderId: string
  rating: number
  comment: string | null
  isHidden: boolean
  createdAt: string
  user: { name: string }
}

export interface AdminReviewView extends ReviewView {
  product: { id: string, name: string, slug: string }
}

export interface ReviewEligibility {
  eligible: boolean
  alreadyReviewed: boolean
  orderId: string | null
}
