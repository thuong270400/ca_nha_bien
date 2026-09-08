import { randomUUID } from 'node:crypto'
import type { H3Event } from 'h3'
import type { CartModel } from '../generated/prisma/models'
import { prisma } from './prisma'

const GUEST_CART_COOKIE = 'guest_cart_id'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

/**
 * Resolves the DB-backed cart for the current request: the logged-in user's
 * cart, or a guest cart tracked via an httpOnly cookie. If a guest cart
 * exists at login time, its items are merged into the user's cart.
 */
export async function resolveCartId(event: H3Event): Promise<string> {
  const session = await getUserSession(event)
  const userId = session.user?.id

  if (userId) return resolveUserCartId(event, userId)
  return resolveGuestCartId(event)
}

async function resolveUserCartId(event: H3Event, userId: string) {
  let cart = await prisma.cart.findUnique({ where: { userId } })

  const guestSessionId = getCookie(event, GUEST_CART_COOKIE)
  if (guestSessionId) {
    const guestCart = await prisma.cart.findUnique({
      where: { sessionId: guestSessionId },
      include: { items: true },
    })
    if (guestCart && guestCart.userId !== userId) {
      cart = await mergeGuestCartIntoUserCart(guestCart, userId, cart)
    }
    deleteCookie(event, GUEST_CART_COOKIE)
  }

  if (!cart) {
    cart = await prisma.cart.create({ data: { userId } })
  }

  return cart.id
}

async function mergeGuestCartIntoUserCart(
  guestCart: { id: string, items: { variantId: string, productId: string, quantity: number }[] },
  userId: string,
  userCart: CartModel | null,
) {
  return prisma.$transaction(async (tx) => {
    const targetCart = userCart ?? (await tx.cart.create({ data: { userId } }))

    for (const item of guestCart.items) {
      const existing = await tx.cartItem.findUnique({
        where: { cartId_variantId: { cartId: targetCart.id, variantId: item.variantId } },
      })
      if (existing) {
        await tx.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + item.quantity } })
      } else {
        await tx.cartItem.create({
          data: { cartId: targetCart.id, variantId: item.variantId, productId: item.productId, quantity: item.quantity },
        })
      }
    }

    await tx.cart.delete({ where: { id: guestCart.id } })
    return targetCart
  })
}

async function resolveGuestCartId(event: H3Event) {
  const existingSessionId = getCookie(event, GUEST_CART_COOKIE)
  if (existingSessionId) {
    const cart = await prisma.cart.findUnique({ where: { sessionId: existingSessionId } })
    if (cart) return cart.id
  }

  const sessionId = randomUUID()
  const cart = await prisma.cart.create({ data: { sessionId } })
  setCookie(event, GUEST_CART_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
  return cart.id
}

export async function clearGuestCartCookie(event: H3Event) {
  deleteCookie(event, GUEST_CART_COOKIE)
}
