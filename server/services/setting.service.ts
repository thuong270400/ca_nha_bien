import type { Prisma, PrismaClient } from '../generated/prisma/client'
import { prisma } from '../utils/prisma'
import { getShippingSettings, SETTINGS_ID } from '../utils/shipping'
import type { SettingUpdateInput } from '../utils/schemas/setting.schema'

type SettingClient = PrismaClient | Prisma.TransactionClient

/**
 * Tài khoản ngân hàng nhận chuyển khoản qua VietQR — dùng trực tiếp để dựng QR
 * (app/utils/vietqr.ts), không chỉ để hiển thị. Nhận `client` tuỳ chọn (mirror
 * getShippingSettings ở server/utils/shipping.ts) để đọc được bên trong
 * $transaction tạo đơn, snapshot lại vào Payment.bankSnapshot.
 */
export async function getBankSettings(client: SettingClient = prisma) {
  const setting = await client.setting.findUnique({ where: { id: SETTINGS_ID } })
  return {
    bankTransferEnabled: setting?.bankTransferEnabled ?? false,
    bankName: setting?.bankName ?? null,
    bankCode: setting?.bankCode ?? null,
    bankAccountNumber: setting?.bankAccountNumber ?? null,
    bankAccountName: setting?.bankAccountName ?? null,
  }
}

/**
 * % cọc trước áp dụng chung cho mọi sản phẩm/loại cá — dùng để snapshot vào
 * Order.depositPercent lúc tạo đơn (order.service.ts#attemptCreateOrder). Nhận
 * `client` tuỳ chọn để đọc được bên trong cùng $transaction tạo đơn, mirror
 * getBankSettings ở trên.
 */
export async function getDepositSettings(client: SettingClient = prisma) {
  const setting = await client.setting.findUnique({ where: { id: SETTINGS_ID } })
  return { depositPercent: setting?.depositPercent ?? 0 }
}

/**
 * Số ngày dự kiến giao hàng áp dụng chung cho MỌI sản phẩm — không khai báo
 * riêng theo từng sản phẩm. Chỉ để hiển thị cho khách lúc tiến hành thanh toán
 * (GET /api/settings/delivery, checkout.vue), không dùng trong bất kỳ tính toán
 * nào — availability (dùng để nhóm đợt giao) vẫn nằm trên Product.availabilityDays,
 * không đổi.
 */
export async function getDeliverySettings(client: SettingClient = prisma) {
  const setting = await client.setting.findUnique({ where: { id: SETTINGS_ID } })
  return {
    deliveryDays: setting?.deliveryDays ?? null,
  }
}

export async function getSettings() {
  const [shipping, bank, deposit, delivery] = await Promise.all([getShippingSettings(), getBankSettings(), getDepositSettings(), getDeliverySettings()])
  return { ...shipping, ...bank, ...deposit, ...delivery }
}

export async function updateSettings(input: SettingUpdateInput) {
  await prisma.setting.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, ...input },
    update: input,
  })
  return getSettings()
}
