import { loadEnvConfig } from '@next/env';
import { PrismaClient, Prisma, Product } from '@prisma/client';
import { mkdir, readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { categories, products, combos, customisationOptions, slugify } from './catalog-data';
loadEnvConfig(process.cwd());
const db = new PrismaClient();
const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
async function placeholder(name: string, view: string) {
  const lines = name.match(/.{1,28}(?:\s|$)/g) || [name];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"><rect width="800" height="800" fill="#f8f4ee"/><rect x="90" y="130" width="620" height="520" rx="24" fill="#fff" stroke="#e8e3dc" stroke-width="3"/><path d="M330 230h140v100H330ZM320 230l80-45 80 45M400 230v100" fill="none" stroke="#b92b27" stroke-width="5"/><text x="400" y="390" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#1e242b">${lines.map((line, i) => `<tspan x="400" dy="${i ? 32 : 0}">${escape(line.trim())}</tspan>`).join('')}</text><text x="400" y="525" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#5f646d">${escape(view)}</text><text x="400" y="585" text-anchor="middle" font-family="sans-serif" font-size="17" fill="#b92b27">TEMPORARY PLACEHOLDER · PHOTO PENDING</text><text x="400" y="720" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#5f646d">Approved product photography will be added here.</text></svg>`;
  const key = `${randomUUID()}.webp`;
  await sharp(Buffer.from(svg)).webp({ lossless: true }).toFile(`public/uploads/${key}`);
  return {
    url: `/media/${key}`,
    storageKey: key,
    alt: `${name}: ${view}. Temporary placeholder; approved photograph pending.`,
    mime: 'image/webp',
    width: 800,
    height: 800,
  };
}
async function main() {
  const backupFile = process.argv[2];
  if (!backupFile) throw new Error('Run backup-catalog.ts first and pass its backup file path.');
  const backup = JSON.parse(await readFile(backupFile, 'utf8'));
  const existing = await db.product.findMany();
  if (!existing.every((p) => backup.products.some((b: { id: string }) => b.id === p.id)))
    throw new Error('Backup does not cover all existing products.');
  if (existing.some((p) => !/^(REF-DIW-|GK-C\d|GK18-)/.test(p.sku)))
    throw new Error('Unrecognised product found. Review before replacing.');
  await mkdir('public/uploads', { recursive: true });
  const images = await Promise.all(
    products.map(async ([name], index) => ({
      main: await placeholder(name, index < 14 ? 'Product view' : 'Complete gift box and contents'),
      extras:
        index < 14
          ? []
          : await Promise.all(
              [
                'Closed gift box',
                'Open box and arranged contents',
                'Packaging and branding detail',
              ].map((view) => placeholder(name, view)),
            ),
    })),
  );
  const packagingImage = await placeholder('Corporate gift packaging', 'Packaging component');
  await db.$transaction(
    async (tx) => {
      const cats = [];
      for (const [position, [name, slug]] of categories.entries())
        cats.push(
          await tx.category.upsert({
            where: { slug },
            create: { name, slug, position, status: 'PUBLISHED' },
            update: { name, position, status: 'PUBLISHED' },
          }),
        );
      const collection = await tx.collection.upsert({
        where: { slug: 'corporate-diwali-gifts' },
        create: {
          slug: 'corporate-diwali-gifts',
          name: 'Corporate Diwali Gifts',
          status: 'PUBLISHED',
        },
        update: {},
      });
      const saved: Product[] = [];
      for (const [index, [name, catIndex, description]] of products.entries()) {
        const slug = slugify(name);
        const data = {
          name,
          slug,
          sku: `GK18-${String(index + 1).padStart(2, '0')}`,
          description,
          shortDescription: description.split('. ')[0] + '.',
          categoryId: cats[catIndex].id,
          productType: index < 14 ? 'individual' : 'combo',
          status: 'PUBLISHED' as const,
          position: index,
          featured: [0, 3, 6, 14].includes(index),
          tags: [categories[catIndex][1], index < 14 ? 'individual' : 'combo'],
          colors: [],
          materials: [],
          branding: [],
          packaging: [
            'Company-branded packaging',
            'Personalised message',
            'Discuss packaging options',
          ],
          customisationOptions,
          variants: [],
          enquiryEnabled: true,
          packagingDetails:
            index < 14
              ? ''
              : 'The listed presentation packaging is included in this predefined gifting brief. Final box design, finish and branding are subject to quotation and approval.',
          seoTitle: `${name} | Geniekart`,
          seoDescription: description.slice(0, 155),
          minimumOrder: null,
          price: null,
          showPrice: false,
        };
        const product = await tx.product.upsert({
          where: { sku: data.sku },
          create: data,
          update: data,
        });
        await tx.redirect.deleteMany({ where: { from: '/products/' + slug } });
        await tx.productImage.deleteMany({ where: { productId: product.id } });
        await tx.productCollection.deleteMany({ where: { productId: product.id } });
        await tx.productAttribute.deleteMany({ where: { productId: product.id } });
        for (const [position, media] of [images[index].main, ...images[index].extras].entries())
          await tx.productImage.create({
            data: { product: { connect: { id: product.id } }, position, media: { create: media } },
          });
        if (index === 14)
          await tx.productCollection.create({
            data: { productId: product.id, collectionId: collection.id },
          });
        saved.push(product);
      }
      const packagingMedia = await tx.mediaAsset.create({ data: packagingImage });
      for (const [indexText, contents] of Object.entries(combos)) {
        const index = Number(indexText);
        const includedProducts = contents.map((c) => ({
          productId: c.index === undefined ? null : saved[c.index].id,
          displayName: c.name,
          quantity: 1,
          image: c.index === undefined ? packagingMedia.url : images[c.index].main.url,
          description: c.description,
        }));
        await tx.product.update({ where: { id: saved[index].id }, data: { includedProducts } });
        for (const [position, c] of contents.entries()) {
          const url = c.index === undefined ? packagingMedia.url : images[c.index].main.url;
          const media = await tx.mediaAsset.findUniqueOrThrow({ where: { url } });
          await tx.productImage.create({
            data: { productId: saved[index].id, mediaId: media.id, position: position + 4 },
          });
        }
      }
      const legacyCategoryMap: Record<string, string> = {
        'diaries-and-notebooks': 'diaries-notebooks',
        'pens-and-writing-instruments': 'premium-pens',
        'coffee-mugs': 'drinkware',
        'water-bottles-and-flasks': 'drinkware',
        'desk-organizers': 'desk-accessories',
        'tech-accessories': 'desk-accessories',
        'backpacks-and-tote-bags': 'bags-laptop-accessories',
        'employee-welcome-kits': 'corporate-gift-combos',
        'executive-gift-sets': 'corporate-gift-combos',
        'diwali-gift-hampers': 'corporate-gift-combos',
        'customized-gift-boxes': 'corporate-gift-combos',
      };
      for (const old of existing.filter((p) => !p.sku.startsWith('GK18-'))) {
        await tx.product.update({
          where: { id: old.id },
          data: { status: 'ARCHIVED', featured: false },
        });
        const oldCategory = backup.categories.find((c: { id: string }) => c.id === old.categoryId);
        const targetCategory =
          legacyCategoryMap[oldCategory?.slug] ||
          (oldCategory?.slug === 'keychains' ? 'keychains' : '');
        const to = targetCategory ? `/categories/${targetCategory}` : '/corporate-gifts';
        await tx.redirect.updateMany({ where: { to: '/products/' + old.slug }, data: { to } });
        await tx.redirect.upsert({
          where: { from: '/products/' + old.slug },
          create: { from: '/products/' + old.slug, to },
          update: { to },
        });
      }
      const oldCategories = await tx.category.findMany({
        where: { id: { notIn: cats.map((c) => c.id) } },
      });
      for (const old of oldCategories) {
        // Only categories captured in the approved catalog backup are changed.
        if (!backup.categories.some((c: { id: string }) => c.id === old.id)) continue;
        await tx.category.update({ where: { id: old.id }, data: { status: 'ARCHIVED' } });
        const to = legacyCategoryMap[old.slug]
          ? `/categories/${legacyCategoryMap[old.slug]}`
          : '/corporate-gifts';
        await tx.redirect.upsert({
          where: { from: '/categories/' + old.slug },
          create: { from: '/categories/' + old.slug, to },
          update: { to },
        });
      }
      for (const old of backup.packages) {
        if (
          ![
            'the-premier-partner-box',
            'aurora-vip-welcome-set',
            'festive-delights-set',
            'everyday-celebration-kit',
          ].includes(old.slug)
        )
          continue;
        await tx.giftPackage.update({
          where: { id: old.id },
          data: { status: 'ARCHIVED', featured: false },
        });
        const to = '/categories/corporate-gift-combos';
        await tx.redirect.upsert({
          where: { from: '/packages/' + old.slug },
          create: { from: '/packages/' + old.slug, to },
          update: { to },
        });
      }
      const home = await tx.page.findUnique({ where: { slug: 'home' } });
      if (home)
        for (const section of await tx.section.findMany({
          where: { pageId: home.id, kind: { in: ['hero', 'portfolio'] } },
        })) {
          const replaceImage = (value: Prisma.JsonValue | null) =>
            value && typeof value === 'object' && !Array.isArray(value)
              ? { ...value, imageUrl: images[15].main.url, imageAlt: images[15].main.alt }
              : value;
          await tx.section.update({
            where: { id: section.id },
            data: {
              draft: replaceImage(section.draft) as Prisma.InputJsonValue,
              ...(section.published
                ? { published: replaceImage(section.published) as Prisma.InputJsonValue }
                : {}),
            },
          });
        }
      if ((await tx.product.count({ where: { status: 'PUBLISHED' } })) !== 18)
        throw new Error('Final catalogue count is not 18; rolling back.');
    },
    { timeout: 60000 },
  );
  console.log(
    'Catalogue replaced: 18 published listings (14 individual, 4 combo). Legacy records archived and URLs redirected.',
  );
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
