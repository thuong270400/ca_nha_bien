import { Prisma } from '../generated/prisma/client'
import { Errors } from '../utils/errors'
import { prisma } from '../utils/prisma'
import { calculateShippingFee } from '../utils/shipping'

const cartItemInclude = {
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      deletedAt: true,
      images: { take: 1, orderBy: { position: 'asc' as const } },
    },
  },
  variant: true,
} satisfies Prisma.CartItemInclude

async function assertVariantAvailable(variantId: string) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true },
  })
  if (!variant || variant.product.deletedAt || variant.product.status !== 'ACTIVE') {
    throw Errors.notFound('Sản phẩm không còn tồn tại')
  }
  return variant
}

function summarizeCart(cart: { id: string, items: Prisma.CartItemGetPayload<{ include: typeof cartItemInclude }>[] }) {
  const items = cart.items.map((item) => {
    const price = Number(item.variant.price)
    const available = item.variant.stock >= item.quantity
      && item.product.status === 'ACTIVE'
      && !item.product.deletedAt
    return {
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      unit: item.variant.unit,
      price: item.variant.price,
      lineTotal: (price * item.quantity).toFixed(2),
      stock: item.variant.stock,
      available,
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        image: item.product.images[0]?.url ?? null,
      },
    }
  })

  const subtotal = items.reduce((sum, item) => sum + Number(item.lineTotal), 0)
  const shippingFee = calculateShippingFee(subtotal)

  return {
    id: cart.id,
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: subtotal.toFixed(2),
    shippingFee: shippingFee.toFixed(2),
    total: (subtotal + shippingFee).toFixed(2),
  }
}

export async function getCart(cartId: string) {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { items: { orderBy: { createdAt: 'asc' }, include: cartItemInclude } },
  })
  if (!cart) throw Errors.notFound('Không tìm thấy giỏ hàng')
  return summarizeCart(cart)
}

export async function addCartItem(cartId: string, variantId: string, quantity: number) {
  const variant = await assertVariantAvailable(variantId)

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId, variantId } },
  })
  const nextQuantity = (existing?.quantity ?? 0) + quantity
  if (nextQuantity > variant.stock) {
    throw Errors.badRequest(`Chỉ còn ${variant.stock} sản phẩm trong kho`)
  }

  if (existing) {
    await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: nextQuantity } })
  } else {
    await prisma.cartItem.create({
      data: { cartId, variantId, productId: variant.productId, quantity },
    })
  }

  return getCart(cartId)
}

export async function updateCartItem(cartId: string, itemId: string, quantity: number) {
  const item = await prisma.cartItem.findUnique({ where: { id: itemId }, include: { variant: true } })
  if (!item || item.cartId !== cartId) throw Errors.notFound('Không tìm thấy sản phẩm trong giỏ')
  if (quantity > item.variant.stock) {
    throw Errors.badRequest(`Chỉ còn ${item.variant.stock} sản phẩm trong kho`)
  }

  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } })
  return getCart(cartId)
}

export async function removeCartItem(cartId: string, itemId: string) {
  const item = await prisma.cartItem.findUnique({ where: { id: itemId } })
  if (!item || item.cartId !== cartId) throw Errors.notFound('Không tìm thấy sản phẩm trong giỏ')

  await prisma.cartItem.delete({ where: { id: itemId } })
  return getCart(cartId)
}

export async function clearCart(cartId: string) {
  await prisma.cartItem.deleteMany({ where: { cartId } })
}
