/** Bỏ dấu tiếng Việt — VietQR quicklink hiển thị addInfo/accountName không dấu. */
function stripDiacritics(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
}

export interface VietQrBankInfo {
  bankCode: string | null
  bankAccountNumber: string | null
  bankAccountName?: string | null
}

/**
 * Dựng URL ảnh QR VietQR "Quick Link" (miễn phí, không cần API key):
 * https://img.vietqr.io/image/<BANK_CODE>-<ACCOUNT_NO>-<TEMPLATE>.png
 * Trả về `null` nếu thiếu thông tin ngân hàng bắt buộc (chưa cấu hình/snapshot cũ).
 */
export function buildVietQrImageUrl(
  bank: VietQrBankInfo,
  opts: { amount: number, addInfo: string, template?: 'compact2' | 'compact' | 'qr_only' | 'print' },
): string | null {
  if (!bank.bankCode || !bank.bankAccountNumber) return null

  const template = opts.template ?? 'compact2'
  const base = `https://img.vietqr.io/image/${encodeURIComponent(bank.bankCode)}-${encodeURIComponent(bank.bankAccountNumber)}-${template}.png`

  const params = new URLSearchParams()
  params.set('amount', String(Math.max(0, Math.round(opts.amount))))
  params.set('addInfo', stripDiacritics(opts.addInfo).slice(0, 50))
  if (bank.bankAccountName) params.set('accountName', stripDiacritics(bank.bankAccountName).slice(0, 50))

  return `${base}?${params.toString()}`
}
