import { getDepositSettings } from '../../services/setting.service'

// Công khai (không cần đăng nhập) — trang checkout dùng để xem trước số tiền
// cọc sẽ cần chuyển khoản trước khi đặt hàng, xem Setting.depositPercent.
export default defineApiHandler(async () => {
  return getDepositSettings()
})
