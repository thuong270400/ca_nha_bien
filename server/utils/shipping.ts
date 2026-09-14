import type { Prisma, PrismaClient } from '../generated/prisma/client'
import { prisma } from './prisma'

/** Fixed id of the singleton `Setting` row — see prisma/schema.prisma. */
export const SETTINGS_ID = 'default'

export const DEFAULT_SHIPPING_FEE = 50_000
export const DEFAULT_FREE_SHIPPING_THRESHOLD = 500_000

type ShippingClient = PrismaClient | Prisma.TransactionClient

export async function getShippingSettings(client: ShippingClient = prisma) {
  const setting = await client.setting.findUnique({ where: { id: SETTINGS_ID } })
  return {
    shippingFee: setting ? Number(setting.shippingFee) : DEFAULT_SHIPPING_FEE,
    freeShippingThreshold: setting ? Number(setting.freeShippingThreshold) : DEFAULT_FREE_SHIPPING_THRESHOLD,
  }
}

/** Flat-rate shipping: free above the threshold, otherwise a fixed fee — both admin-configurable via Setting. */
export async function calculateShippingFee(subtotal: number, client: ShippingClient = prisma): Promise<number> {
  if (subtotal <= 0) return 0
  const { shippingFee, freeShippingThreshold } = await getShippingSettings(client)
  return subtotal >= freeShippingThreshold ? 0 : shippingFee
}
