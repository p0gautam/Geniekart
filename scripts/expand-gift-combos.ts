import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import assert from 'node:assert/strict';
import additions from './additional-combos.json';
import { products, slugify, customisationOptions } from './catalog-data';
loadEnvConfig(process.cwd());
const db = new PrismaClient();
async function main() {
  const backup = {
    navigation: await db.navigationItem.findMany(),
    products: await db.product.findMany({ include: { images: true, collections: true } }),
  };
  await mkdir('.local/backups', { recursive: true });
  await writeFile(
    `.local/backups/expand-combos-${Date.now()}.json`,
    JSON.stringify(backup, null, 2),
  );
  const dir = 'public/images/products/corporate-gift-combos';
  await mkdir(dir, { recursive: true });
  for (const item of additions)
    await sharp(item.source)
      .resize(1024, 1024, { fit: 'inside' })
      .webp({ quality: 85 })
      .toFile(`${dir}/${item.slug}-main.webp`);
  await db.$transaction(
    async (tx) => {
      const category = await tx.category.findUniqueOrThrow({
        where: { slug: 'corporate-gift-combos' },
      });
      const collection = await tx.collection.findUniqueOrThrow({
        where: { slug: 'corporate-diwali-gifts' },
      });
      const packaging = await tx.mediaAsset.findUniqueOrThrow({
        where: { url: '/images/products/packaging/premium-gift-packaging-main.webp' },
      });
      for (const [index, item] of additions.entries()) {
        const components = await Promise.all(
          item.components.map((i) =>
            tx.product.findUniqueOrThrow({
              where: { slug: slugify(products[i][0]) },
              include: { images: { include: { media: true }, orderBy: { position: 'asc' } } },
            }),
          ),
        );
        const includedProducts = [
          ...components.map((p) => ({
            productId: p.id,
            displayName: p.name,
            quantity: 1,
            image: p.images[0].media.url,
            description: p.shortDescription,
          })),
          {
            productId: null,
            displayName: 'Premium Gift Packaging',
            quantity: 1,
            image: packaging.url,
            description: 'Presentation packaging with branding and finish confirmed on enquiry.',
          },
        ];
        const url = `/images/products/corporate-gift-combos/${item.slug}-main.webp`;
        const media = await tx.mediaAsset.upsert({
          where: { url },
          update: {},
          create: {
            url,
            alt: `${item.name} — AI-generated representative image`,
            width: 1024,
            height: 1024,
          },
        });
        const data = {
          name: item.name,
          description: item.description,
          shortDescription: item.description,
          categoryId: category.id,
          productType: 'combo',
          includedProducts,
          customisationOptions,
          packagingDetails:
            'Gift presentation is included. Final box design, finish and branding are confirmed in your quotation.',
          packaging: [
            'Company-branded packaging',
            'Personalised message',
            'Discuss packaging options',
          ],
          tags: ['corporate', 'diwali', 'combo'],
          colors: [],
          materials: [],
          branding: [],
          enquiryEnabled: true,
          status: 'PUBLISHED' as const,
          position: 18 + index,
        };
        const product = await tx.product.upsert({
          where: { slug: item.slug },
          update: data,
          create: { ...data, slug: item.slug, sku: `GK-COMBO-${index + 5}` },
        });
        await tx.productImage.deleteMany({ where: { productId: product.id } });
        const gallery = [
          media.id,
          ...components.map((p) => p.images[0].mediaId),
          packaging.id,
        ].slice(0, 4);
        await tx.productImage.createMany({
          data: gallery.map((mediaId, position) => ({ productId: product.id, mediaId, position })),
        });
      }
      const combos = await tx.product.findMany({
        where: { status: 'PUBLISHED', productType: 'combo' },
        orderBy: { position: 'asc' },
      });
      assert.equal(combos.length, 8);
      for (const [position, product] of combos.entries())
        await tx.productCollection.upsert({
          where: { productId_collectionId: { productId: product.id, collectionId: collection.id } },
          create: { productId: product.id, collectionId: collection.id, position },
          update: { position },
        });
      await tx.navigationItem.updateMany({
        where: { label: 'Enterprise Services', location: 'header' },
        data: { label: 'Corporate Gifts', href: '/corporate-gifts' },
      });
      console.log(
        'Published eight corporate gifting combos in Diwali & Hampers; navigation updated.',
      );
    },
    { timeout: 30000 },
  );
}
main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
