import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
import { mkdir, writeFile } from 'node:fs/promises';
loadEnvConfig(process.cwd());
const db = new PrismaClient();
async function main() {
  const snapshot = await db.$transaction(async (tx) => ({
    createdAt: new Date().toISOString(),
    products: await tx.product.findMany({
      include: { images: true, attributes: true, collections: true },
    }),
    packages: await tx.giftPackage.findMany({ include: { images: true, items: true } }),
    categories: await tx.category.findMany(),
    collections: await tx.collection.findMany(),
    media: await tx.mediaAsset.findMany(),
    redirects: await tx.redirect.findMany(),
  }));
  await mkdir('.local/backups', { recursive: true });
  const file = `.local/backups/catalog-${Date.now()}.json`;
  await writeFile(file, JSON.stringify(snapshot, null, 2), { flag: 'wx' });
  console.log(
    JSON.stringify({
      file,
      products: snapshot.products.length,
      packages: snapshot.packages.length,
    }),
  );
}
main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
