export default defineSitemapEventHandler(async () => {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { deletedAt: null, status: 'ACTIVE' },
      select: { slug: true, updatedAt: true },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
  ])

  return [
    ...products.map(p => ({ loc: `/products/${p.slug}`, lastmod: p.updatedAt, _sitemap: 'products' })),
    ...categories.map(c => ({ loc: `/categories/${c.slug}`, lastmod: c.updatedAt })),
  ]
})
