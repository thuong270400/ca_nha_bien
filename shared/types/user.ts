export interface SafeUser {
  id: string
  email: string
  name: string
  phone: string | null
  role: 'CUSTOMER' | 'ADMIN'
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}
