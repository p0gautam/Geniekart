import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import assert from 'node:assert/strict';
import { categories, products, slugify } from './catalog-data';
import { comboContents } from '../src/lib/combo';
loadEnvConfig(process.cwd());
const db = new PrismaClient();
type Asset = {
  index: number;
  slug: string;
  source: string;
  prompt: string;
  alternateSource?: string;
  alternatePrompt?: string;
};
async function main() {
  const assets: Asset[] = JSON.parse(await readFile('scripts/product-image-manifest.json', 'utf8'));
  assert.equal(assets.length, 19);
  const before = await db.product.findMany({
    where: { status: 'PUBLISHED' },
    include: { images: { include: { media: true } } },
    orderBy: { position: 'asc' },
  });
  assert.deepEqual(
    before.map((p) => p.name),
    products.map((p) => p[0]),
  );
  await mkdir('.local/backups', { recursive: true });
  const backup = `.local/backups/product-images-${Date.now()}.json`;
  await writeFile(backup, JSON.stringify(before, null, 2), { flag: 'wx' });
  const prepared = new Map<number, { url: string; alt: string; width: number; height: number }[]>();
  for (const asset of assets) {
    const category = asset.index < 18 ? categories[products[asset.index][1]][1] : 'packaging';
    const slug = asset.index < 18 ? slugify(products[asset.index][0]) : asset.slug;
    const dir = `public/images/products/${category}`;
    await mkdir(dir, { recursive: true });
    if (asset.index < 14) assert.ok(asset.alternateSource, `Missing alternate for ${slug}`);
    const variants = [
      { source: asset.source, name: 'main' },
      ...(asset.alternateSource ? [{ source: asset.alternateSource, name: 'alternate' }] : []),
    ];
    const images = [];
    for (const variant of variants) {
      const url = `/images/products/${category}/${slug}-${variant.name}.webp`;
      const info = await sharp(variant.source)
        .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(`public${url}`);
      images.push({
        url,
        alt: `${products[asset.index]?.[0] || 'Premium gift packaging'} — ${variant.name} view, AI-generated representative image`,
        width: info.width,
        height: info.height,
      });
    }
    prepared.set(asset.index, images);
  }
  await db.$transaction(
    async (tx) => {
      const media = new Map<string, string>();
      for (const images of prepared.values())
        for (const image of images) {
          const saved = await tx.mediaAsset.upsert({
            where: { url: image.url },
            create: image,
            update: image,
          });
          media.set(image.url, saved.id);
        }
      for (let i = 0; i < before.length; i++) {
        const p = before[i];
        const contents = comboContents(p.includedProducts).map((c) => ({
          ...c,
          image: prepared.get(
            c.productId ? before.findIndex((item) => item.id === c.productId) : 18,
          )![0].url,
        }));
        const gallery = [...prepared.get(i)!];
        if (p.productType === 'combo')
          for (const c of contents.slice(0, 3)) {
            const component = [...prepared.values()].flat().find((image) => image.url === c.image)!;
            gallery.push(component);
          }
        await tx.productImage.deleteMany({ where: { productId: p.id } });
        await tx.productImage.createMany({
          data: gallery.map((image, position) => ({
            productId: p.id,
            mediaId: media.get(image.url)!,
            position,
          })),
        });
        if (contents.length)
          await tx.product.update({ where: { id: p.id }, data: { includedProducts: contents } });
      }
      const after = await tx.product.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { position: 'asc' },
      });
      const stable = (p: (typeof after)[number]) => {
        const { updatedAt, includedProducts, ...rest } = p;
        void updatedAt;
        void includedProducts;
        return rest;
      };
      assert.deepEqual(
        after.map(stable),
        before.map(({ images, ...p }) => {
          void images;
          return stable(p);
        }),
      );
    },
    { timeout: 30000 },
  );
  console.log(
    JSON.stringify({
      backup,
      products: before.length,
      images: [...prepared.values()].flat().length,
      directory: 'public/images/products',
    }),
  );
}
main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
