import { getDeliverySettings } from '../../services/setting.service'

// Công khai (không cần đăng nhập) — trang checkout dùng để hiển thị số ngày
// dự kiến giao hàng chung, xem Setting.deliveryDays.
export default defineApiHandler(async () => {
  return getDeliverySettings()
})
