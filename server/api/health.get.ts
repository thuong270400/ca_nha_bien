export default defineApiHandler(async () => {
  const categoryCount = await prisma.category.count()
  return { ok: true, categoryCount }
})
