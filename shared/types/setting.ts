export interface SettingView {
  shippingFee: number
  freeShippingThreshold: number
  depositPercent: number
  deliveryFromDays: number | null
  deliveryToDays: number | null
  bankTransferEnabled: boolean
  bankName: string | null
  bankCode: string | null
  bankAccountNumber: string | null
  bankAccountName: string | null
}

/** Subset of SettingView exposed publicly (GET /api/settings/delivery) for storefront display. */
export interface DeliverySettingView {
  deliveryFromDays: number | null
  deliveryToDays: number | null
}

/** Subset of SettingView exposed publicly (GET /api/settings/deposit) so checkout can preview the amount due upfront for BANK_TRANSFER before placing the order. */
export interface DepositSettingView {
  depositPercent: number
}
