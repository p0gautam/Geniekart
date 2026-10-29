import { loadEnvConfig } from '@next/env';
import { PrismaClient, Prisma } from '@prisma/client';
import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import sharp from 'sharp';
import assets from './reference-assets.json';
import { occasions } from '../src/lib/occasions';
loadEnvConfig(process.cwd());
const db = new PrismaClient();
const definitions = [
  [
    'Executive Signature Set',
    [
      'Laptop briefcase',
      'Loop-cap bottle',
      'Textured black diary',
      'Boxed pen',
      'Digital desk clock',
      'Card holder',
    ],
    [0, 1, 2, 3, 4],
  ],
  [
    'Cork & Glass Executive Set',
    [
      'Brown laptop briefcase',
      'Jute-sleeved glass bottle',
      'Cork-style diary',
      'Glass cup',
      'Glass cup',
      'Digital desk clock',
    ],
    [0, 1, 3, 4],
  ],
  [
    'Tan Pocket Diary Gift Set',
    ['Tan pocket diary', 'Metal pen', 'Jute-sleeved glass bottle'],
    [1, 2, 4],
  ],
  [
    'Black Business Essentials Set',
    ['Metal card holder', 'Metal pen', 'Metal keychain', 'Temperature-style bottle'],
    [0, 1, 2, 3, 4],
  ],
  [
    'Cork Celebration Gift Set',
    ['Laptop briefcase', 'Cork-style diary', 'Cork-base bottle', 'Lidded mug', 'Boxed pen'],
    [0, 1, 3, 4],
  ],
  [
    'Blue Bamboo & Jute Gift Set',
    [
      'Blue bamboo-style diary',
      'Jute-sleeved glass bottle',
      'Bamboo-style pen',
      'Phone stand',
      'Metal keychain',
      'Bamboo-style card holder',
    ],
    [0, 1, 2, 4],
  ],
  [
    'Tan Diary & Bottle Gift Set',
    ['Tan clasp diary', 'Black rope-loop bottle', 'Matching pen'],
    [1, 2, 3, 4],
  ],
  [
    'Blush Business Gift Set',
    ['Blush tan diary', 'Blush bottle', 'Matching pen', 'Matching keychain'],
    [0, 1, 2, 3, 4],
  ],
  [
    'Blue Bamboo & Black Bottle Set',
    [
      'Blue bamboo-style diary',
      'Black wooden-cap bottle',
      'Bamboo-style pen',
      'Phone stand',
      'Metal keychain',
      'Bamboo-style card holder',
    ],
    [0, 1, 2, 3, 4],
  ],
] as const;
async function main() {
  if (assets.length !== 9) throw new Error('All nine reviewed assets are required');
  await mkdir('.local/backups', { recursive: true });
  await writeFile(
    `.local/backups/combo-only-${Date.now()}.json`,
    JSON.stringify(
      {
        products: await db.product.findMany({ include: { images: true, collections: true } }),
        collections: await db.collection.findMany(),
        navigation: await db.navigationItem.findMany(),
        sections: await db.section.findMany(),
      },
      null,
      2,
    ),
  );
  for (const a of assets) {
    await copyFile(a.source, `assets/masters/${a.slug}.png`);
    for (const width of [480, 768, 1024])
      await sharp(`assets/masters/${a.slug}.png`)
        .resize(width, width, { fit: 'contain', background: '#f6f1e8' })
        .webp({ quality: 85 })
        .toFile(`public/images/combos/${a.slug}-${width}.webp`);
  }
  await db.$transaction(
    async (tx) => {
      const category = await tx.category.findUniqueOrThrow({
        where: { slug: 'corporate-gift-combos' },
      });
      const collections = [];
      for (const [position, o] of occasions.entries())
        collections.push(
          await tx.collection.upsert({
            where: { slug: o.slug },
            update: { name: o.name, status: 'PUBLISHED', position },
            create: {
              slug: o.slug,
              name: o.name,
              status: 'PUBLISHED',
              position,
              description: `Complete gift sets to explore for ${o.name.toLowerCase()}.`,
            },
          }),
        );
      for (const [i, a] of assets.entries()) {
        const [name, components, memberships] = definitions[i];
        const url = `/images/combos/${a.slug}-1024.webp`;
        const grouped = [...new Set(components)].map((displayName) => ({
          productId: null,
          displayName,
          quantity: components.filter((n) => n === displayName).length,
          image: '',
          description: 'Appearance and personalisation confirmed during quotation.',
        }));
        const description =
          components.join(', ') +
          '. Branding and final presentation are confirmed during quotation.';
        const data = {
          name,
          description,
          shortDescription: components.join(' · '),
          categoryId: category.id,
          productType: 'combo',
          includedProducts: grouped as Prisma.InputJsonValue,
          featured: i < 8,
          position: i,
          enquiryEnabled: true,
          status: 'PUBLISHED' as const,
          showPrice: false,
          price: null,
          tags: ['combo', ...memberships.map((n) => occasions[n].name)],
          packagingDetails: 'Presentation and branding are confirmed during quotation.',
          customisationOptions: ['Discuss logo personalisation', 'Discuss presentation packaging'],
        };
        const product = await tx.product.upsert({
          where: { slug: a.slug },
          update: data,
          create: { ...data, slug: a.slug, sku: `GK-REF-${i + 1}` },
        });
        const media = await tx.mediaAsset.upsert({
          where: { url },
          update: { alt: `${name}: ${components.join(', ')}. Illustrative generated photograph.` },
          create: {
            url,
            alt: `${name}: ${components.join(', ')}. Illustrative generated photograph.`,
            width: 1024,
            height: 1024,
          },
        });
        await tx.productImage.deleteMany({ where: { productId: product.id } });
        await tx.productImage.create({
          data: { productId: product.id, mediaId: media.id, position: 0 },
        });
        await tx.productCollection.deleteMany({ where: { productId: product.id } });
        for (const n of memberships)
          await tx.productCollection.create({
            data: { productId: product.id, collectionId: collections[n].id, position: i },
          });
      }
      // Retain existing complete combos and individual component records non-destructively.
      const existing = await tx.product.findMany({
        where: {
          status: 'PUBLISHED',
          productType: 'combo',
          slug: { notIn: assets.map((a) => a.slug) },
        },
      });
      for (const [i, p] of existing.entries()) {
        await tx.product.update({
          where: { id: p.id },
          data: { position: 20 + i, featured: false },
        });
        for (const n of [1, 2, 3, 4])
          await tx.productCollection.upsert({
            where: { productId_collectionId: { productId: p.id, collectionId: collections[n].id } },
            update: {},
            create: { productId: p.id, collectionId: collections[n].id, position: 20 + i },
          });
      }
      await tx.navigationItem.deleteMany({ where: { location: 'header' } });
      await tx.navigationItem.create({ data: { label: 'Home', href: '/', position: 0 } });
      const gifting = await tx.navigationItem.create({
        data: { label: 'Gifting', href: '/corporate-gifts', position: 1 },
      });
      await tx.navigationItem.createMany({
        data: [
          { label: 'Corporate Gifts', href: '/corporate-gifts', parentId: gifting.id, position: 0 },
          ...occasions.map((o, i) => ({
            label: o.name,
            href: o.href,
            parentId: gifting.id,
            position: i + 1,
          })),
          { label: 'Why GenieKart', href: '/#benefits', position: 2 },
          { label: 'Contact Us', href: '/contact', position: 3 },
        ],
      });
      const sections = await tx.section.findMany({ where: { kind: 'portfolio' } });
      for (const section of sections) {
        const update = (value: Prisma.JsonValue | null) =>
          value && typeof value === 'object' && !Array.isArray(value)
            ? {
                ...value,
                imageUrl: '/images/combos/cork-celebration-gift-set-1024.webp',
                imageAlt: 'Illustrative Geniekart cork celebration gift set',
              }
            : undefined;
        await tx.section.update({
          where: { id: section.id },
          data: { published: update(section.published), draft: update(section.draft) },
        });
      }
    },
    { timeout: 60000 },
  );
  console.log(
    'Nine reference sets added. Existing eight combos and all component records retained. Five occasion collections ready.',
  );
}
main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
