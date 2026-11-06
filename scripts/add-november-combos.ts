import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
import { access } from 'node:fs/promises';
import { includedProductSchema } from '../src/lib/validation';

loadEnvConfig(process.cwd());
const db = new PrismaClient();
const sets = [
  { slug: 'midnight-executive-gift-set', name: 'Midnight Executive Gift Set', color: 'Black', items: ['Laptop briefcase', 'Loop-cap bottle', 'Textured black diary', 'Digital desk clock', 'Metal pen'] },
  { slug: 'ivory-everyday-gift-set', name: 'Ivory Everyday Gift Set', color: 'White', items: ['White bottle with wrist strap', 'Elastic-band notebook', 'Coffee mug', 'Matching pen', 'Keychain'] },
  { slug: 'woodland-executive-gift-set', name: 'Woodland Executive Gift Set', color: 'Brown', items: ['Brown laptop briefcase', 'Bamboo-style bottle', 'Wood-grain diary', 'Analog desk clock', 'Glass cup', 'Cork-grip pen'] },
  { slug: 'black-backpack-welcome-kit', name: 'Black Backpack Welcome Kit', color: 'Black', items: ['Black backpack', 'Sleeved glass bottle', 'Clasp diary', 'Phone stand', 'Metal pen'] },
];

async function main() {
  const target = new URL(process.env.DATABASE_URL || '');
  if (!['127.0.0.1', 'localhost'].includes(target.hostname)) {
    throw new Error('This importer is local-only. Production publication needs separate approval.');
  }
  for (const set of sets) {
    for (const size of [480, 768, 1024]) await access(`public/images/combos/${set.slug}-${size}.webp`);
  }
  const collections = await db.collection.findMany({ where: { slug: { in: ['onboarding-kits', 'appreciation-hampers', 'work-anniversary'] }, status: 'PUBLISHED' } });
  if (collections.length !== 3) throw new Error('Expected collections are missing; no products added.');
  await db.$transaction(async (tx) => {
    const first = await tx.product.aggregate({ _min: { position: true }, where: { productType: 'combo', status: 'PUBLISHED' } });
    for (const [index, set] of sets.entries()) {
      // Never overwrite an existing catalogue entry or duplicate it on rerun.
      if (await tx.product.findUnique({ where: { slug: set.slug } })) continue;
      const url = `/images/combos/${set.slug}-1024.webp`;
      const description = `${set.name} brings together ${set.items.map(s => s.toLowerCase()).join(', ')} for corporate gifting. Discuss quantities, branding and packaging with our team. Final specifications and availability are confirmed during quotation.`;
      const includedProducts = set.items.map(displayName => includedProductSchema.parse({ displayName, quantity: 1, image: '', description: '' }));
      const media = await tx.mediaAsset.upsert({ where: { url }, update: {}, create: { url, alt: `${set.name}: ${set.items.join(', ')}. Supplied product illustration.`, width: 1024, height: 1024 } });
      await tx.product.create({ data: {
        slug: set.slug, name: set.name, sku: `GK-NOV26-${index + 1}`, productType: 'combo',
        description, shortDescription: set.items.join(' · '), includedProducts,
        status: 'PUBLISHED', enquiryEnabled: true, position: (first._min.position ?? 0) - sets.length + index,
        colors: [set.color], tags: ['combo', 'corporate-gifts', 'november-2026'], materials: [], branding: [], packaging: [],
        packagingDetails: 'Packaging and branding options are confirmed during quotation. Decorative props in the image are not included.',
        seoTitle: `${set.name} | Geniekart`, seoDescription: description,
        images: { create: { mediaId: media.id, position: 0 } },
        collections: { create: collections.map(c => ({ collectionId: c.id })) },
      } });
    }
  });
  console.log(JSON.stringify(await db.product.findMany({ where: { slug: { in: sets.map(s => s.slug) } }, select: { name: true, slug: true, status: true } }), null, 2));
}
main().catch(() => { console.error('Combo import failed; check local database, assets and collection setup.'); process.exitCode = 1; }).finally(() => db.$disconnect());
