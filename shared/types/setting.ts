export interface SettingView {
  shippingFee: number
  freeShippingThreshold: number
  bankTransferEnabled: boolean
  bankName: string | null
  bankCode: string | null
  bankAccountNumber: string | null
  bankAccountName: string | null
}
