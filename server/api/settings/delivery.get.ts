import { getDeliverySettings } from '../../services/setting.service'

// Công khai (không cần đăng nhập) — trang sản phẩm dùng để hiển thị khoảng
// ngày dự kiến giao hàng chung, xem Setting.deliveryFromDays/ToDays.
export default defineApiHandler(async () => {
  return getDeliverySettings()
})
