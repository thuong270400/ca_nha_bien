import { prisma } from '../utils/prisma'
import { getShippingSettings, SETTINGS_ID } from '../utils/shipping'
import type { SettingUpdateInput } from '../utils/schemas/setting.schema'

export async function getSettings() {
  return getShippingSettings()
}

export async function updateSettings(input: SettingUpdateInput) {
  await prisma.setting.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, ...input },
    update: input,
  })
  return getShippingSettings()
}
