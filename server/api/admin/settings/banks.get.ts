interface VietQrBank {
  code: string
  bin: string
  shortName: string
  name: string
  logo: string
  transferSupported: number
}

// Proxy danh sách ngân hàng công khai của VietQR (không cần API key) — dùng để
// đổ dropdown chọn ngân hàng ở trang Cài đặt, tránh admin gõ tay mã BIN dễ sai.
export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const res = await $fetch<{ data: VietQrBank[] }>('https://api.vietqr.io/v2/banks')
  return res.data
    .filter(bank => bank.transferSupported === 1)
    .map(bank => ({ code: bank.code, bin: bank.bin, name: bank.shortName, logo: bank.logo }))
})
