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

export async function getSettings() {
  const [shipping, bank] = await Promise.all([getShippingSettings(), getBankSettings()])
  return { ...shipping, ...bank }
}

export async function updateSettings(input: SettingUpdateInput) {
  await prisma.setting.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, ...input },
    update: input,
  })
  return getSettings()
}
