// One-off migration for the ALREADY-SEEDED database: re-points existing products
// at the new "chỉ bán cá biển cấp đông" category set (organized by cut: whole /
// fillet / chunk-sliced / specialty) without deleting any product data.
// prisma/seed.ts already has the new categories for a *fresh* `db:seed` (which
// wipes everything) — this script is for the current database, which still has
// the previous "tươi sống / phi lê / đặc sản / đông lạnh" structure from the
// prior migration.
//
// Dry run (default, no writes):
//   npx tsx scripts/migrate-categories-frozen-only.ts
// Apply for real:
//   npx tsx scripts/migrate-categories-frozen-only.ts --apply
//
// What it does:
//   1. Upserts the 5 new categories (ca-nguyen-con-cap-dong, ca-phi-le [renamed
//      in place], ca-cat-khuc-cap-dong, ca-dac-san [renamed in place],
//      combo-uu-dai). ca-phi-le and ca-dac-san keep their id/slug — no product
//      re-pointing needed for what's already correctly in them.
//   2. Products currently under "ca-bien-tuoi-song" (whole fresh fish) move to
//      "ca-nguyen-con-cap-dong" — same cut, now framed as frozen.
//   3. Products under "ca-dong-lanh" (the old generic frozen bucket) are split:
//      "Cá Hồi Đông Lạnh" (already a fillet) -> ca-phi-le;
//      "Cá Saba Đông Lạnh" (sold as sliced steaks) -> ca-cat-khuc-cap-dong.
//      This mirrors the two products' actual cut, matched by name — extend the
//      SABA_TO_CHUNK / SALMON_TO_FILLET lists below if your real data has more.
//   4. The now-empty "ca-bien-tuoi-song" and "ca-dong-lanh" categories are
//      deleted (safe: 0 products left, no FK left dangling).
//   5. Categories "ca-nuoc-ngot" / "hai-san" are NOT touched by this script —
//      they were already deactivated and their products soft-deleted in the
//      previous migration (business stopped selling freshwater fish / non-fish
//      seafood). This script prints their current product list so you can
//      confirm what to do with them (see the printed section at the end); it
//      does not decide on your behalf.
import 'dotenv/config'
import { prisma } from '../server/utils/prisma'

const APPLY = process.argv.includes('--apply')

const NEW_CATEGORIES = [
  { name: 'Cá nguyên con cấp đông', slug: 'ca-nguyen-con-cap-dong', description: 'Cá biển nguyên con, cấp đông ngay sau đánh bắt để giữ trọn độ tươi.', imageUrl: '/images/seed/ca-nguyen-con-cap-dong.svg', position: 1 },
  { name: 'Cá phi lê cấp đông', slug: 'ca-phi-le', description: 'Cá biển đã lóc xương, phi lê sẵn, cấp đông tiện chế biến.', imageUrl: '/images/seed/ca-phi-le.svg', position: 2 },
  { name: 'Cá cắt khúc/cắt lát cấp đông', slug: 'ca-cat-khuc-cap-dong', description: 'Cá biển cắt khúc hoặc cắt lát sẵn, cấp đông tiện nấu ăn.', imageUrl: '/images/seed/ca-cat-khuc-cap-dong.svg', position: 3 },
  { name: 'Cá đặc sản cấp đông', slug: 'ca-dac-san', description: 'Cá biển cao cấp cấp đông, số lượng có hạn: cá mú, cá hồng...', imageUrl: '/images/seed/ca-dac-san.svg', position: 4 },
  { name: 'Combo/Ưu đãi', slug: 'combo-uu-dai', description: 'Combo cá biển cấp đông tiết kiệm, ưu đãi theo tuần.', imageUrl: '/images/seed/combo-uu-dai.svg', position: 5 },
] as const

const WHOLE_TO_WHOLE_SLUG = 'ca-bien-tuoi-song' // -> ca-nguyen-con-cap-dong (all products, same cut)
const FROZEN_SPLIT_SLUG = 'ca-dong-lanh' // split by name below
const FILLET_NAMES = ['Cá Hồi Đông Lạnh'] // -> ca-phi-le
const CHUNK_NAMES = ['Cá Saba Đông Lạnh'] // -> ca-cat-khuc-cap-dong
const RETIRE_FALLBACK_SLUG = 'hai-san' // already-inactive bucket for out-of-scope (non-fish) leftovers, e.g. Tôm/Mực Đông Lạnh

async function main() {
  console.log(APPLY ? 'Running migration (writes will be applied)...' : 'Dry run — no writes will be made. Pass --apply to execute.')

  console.log('\n== Step 1: new categories ==')
  const idBySlug = new Map<string, string>()
  for (const c of NEW_CATEGORIES) {
    const existing = await prisma.category.findUnique({ where: { slug: c.slug } })
    if (existing) {
      console.log(`  keep+update "${c.slug}" (id=${existing.id})`)
      if (APPLY) await prisma.category.update({ where: { id: existing.id }, data: c })
      idBySlug.set(c.slug, existing.id)
    } else {
      console.log(`  create "${c.slug}"`)
      if (APPLY) {
        const created = await prisma.category.create({ data: c })
        idBySlug.set(c.slug, created.id)
      }
    }
  }

  console.log(`\n== Step 2: "${WHOLE_TO_WHOLE_SLUG}" -> ca-nguyen-con-cap-dong ==`)
  const wholeCategory = await prisma.category.findUnique({ where: { slug: WHOLE_TO_WHOLE_SLUG } })
  if (!wholeCategory) {
    console.log(`  no "${WHOLE_TO_WHOLE_SLUG}" category found — already migrated, skipping.`)
  } else {
    const products = await prisma.product.findMany({ where: { categoryId: wholeCategory.id } })
    for (const p of products) {
      console.log(`  "${p.name}" -> ca-nguyen-con-cap-dong`)
      if (APPLY) {
        const targetId = idBySlug.get('ca-nguyen-con-cap-dong')!
        await prisma.product.update({ where: { id: p.id }, data: { categoryId: targetId } })
      }
    }
  }

  console.log(`\n== Step 3: split "${FROZEN_SPLIT_SLUG}" into ca-phi-le / ca-cat-khuc-cap-dong ==`)
  const frozenCategory = await prisma.category.findUnique({ where: { slug: FROZEN_SPLIT_SLUG } })
  if (!frozenCategory) {
    console.log(`  no "${FROZEN_SPLIT_SLUG}" category found — already migrated, skipping.`)
  } else {
    const products = await prisma.product.findMany({ where: { categoryId: frozenCategory.id } })
    for (const p of products) {
      const targetSlug = FILLET_NAMES.includes(p.name)
        ? 'ca-phi-le'
        : CHUNK_NAMES.includes(p.name)
          ? 'ca-cat-khuc-cap-dong'
          : p.deletedAt
            ? RETIRE_FALLBACK_SLUG // already soft-deleted, out-of-scope leftover (e.g. Tôm/Mực Đông Lạnh) — park with the other retired non-fish products
            : null
      if (!targetSlug) {
        console.log(`  "${p.name}" -> UNRECOGNIZED NAME, left in place — add it to FILLET_NAMES or CHUNK_NAMES and re-run`)
        continue
      }
      console.log(`  "${p.name}" -> ${targetSlug}${targetSlug === RETIRE_FALLBACK_SLUG ? ' (already discontinued, parking with retired products)' : ''}`)
      if (APPLY) {
        const targetCategory = targetSlug === RETIRE_FALLBACK_SLUG
          ? await prisma.category.findUniqueOrThrow({ where: { slug: RETIRE_FALLBACK_SLUG } })
          : null
        const targetId = targetCategory ? targetCategory.id : idBySlug.get(targetSlug)!
        await prisma.product.update({ where: { id: p.id }, data: { categoryId: targetId } })
      }
    }
  }

  console.log('\n== Step 4: delete now-empty old categories ==')
  for (const slug of [WHOLE_TO_WHOLE_SLUG, FROZEN_SPLIT_SLUG]) {
    const category = await prisma.category.findUnique({ where: { slug } })
    if (!category) {
      console.log(`  "${slug}" already gone`)
      continue
    }
    const remaining = await prisma.product.count({ where: { categoryId: category.id } })
    if (remaining === 0) {
      console.log(`  delete "${slug}" (0 products left)`)
      if (APPLY) await prisma.category.delete({ where: { id: category.id } })
    } else {
      console.log(`  "${slug}" still has ${remaining} product(s) — NOT deleting (re-run after Step 2/3 apply)`)
    }
  }

  console.log('\n== Not touched: products already retired last migration ==')
  for (const slug of ['ca-nuoc-ngot', 'hai-san']) {
    const category = await prisma.category.findUnique({ where: { slug } })
    if (!category) {
      console.log(`  "${slug}": not present`)
      continue
    }
    const products = await prisma.product.findMany({ where: { categoryId: category.id } })
    console.log(`  "${slug}" (isActive=${category.isActive}): ${products.length} product(s)`)
    for (const p of products) console.log(`    - ${p.name}${p.deletedAt ? ' [deleted]' : ''}`)
  }

  console.log(APPLY ? '\nDone.' : '\nDry run complete — re-run with --apply to execute the plan above.')
}

main()
  .catch((err) => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
