import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
loadEnvConfig(process.cwd());
const db = new PrismaClient();
async function main() {
  for (const [slug, url] of [
    ['festive-delights-set', '/assets/festive-delights-concept.png'],
    ['everyday-celebration-kit', '/assets/everyday-celebration-concept.png'],
  ]) {
    const pack = await db.giftPackage.findUnique({ where: { slug } });
    if (!pack || pack.status !== 'DRAFT') continue;
    const media = await db.mediaAsset.upsert({
      where: { url },
      update: {},
      create: { url, alt: `AI-generated concept for ${pack.name}; contents are illustrative` },
    });
    await db.$transaction([
      db.packageImage.deleteMany({ where: { packageId: pack.id } }),
      db.packageImage.create({ data: { packageId: pack.id, mediaId: media.id } }),
    ]);
  }
  console.log('Draft concept images attached.');
}
main().finally(() => db.$disconnect());
