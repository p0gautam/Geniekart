import { loadEnvConfig } from '@next/env';
import { PrismaClient, Prisma } from '@prisma/client';
import { mkdir, writeFile } from 'node:fs/promises';
loadEnvConfig(process.cwd());
const db = new PrismaClient();
async function main() {
  const home = await db.page.findUniqueOrThrow({ where: { slug: 'home' } });
  const sections = await db.section.findMany({ where: { pageId: home.id, kind: 'hero' } });
  if (!sections.length) throw new Error('Home hero not found');
  const product = await db.product.findUniqueOrThrow({ where: { slug: 'executive-corporate-gift-box' }, include: { images: { include: { media: true }, orderBy: { position: 'asc' } } } });
  const image = product.images[0].media;
  await mkdir('.local/backups', { recursive: true });
  await writeFile(`.local/backups/hero-image-${Date.now()}.json`, JSON.stringify(sections, null, 2));
  const update = (value: Prisma.JsonValue) => ({ ...(value as Prisma.JsonObject), imageUrl: image.url, imageAlt: image.alt });
  for (const section of sections) await db.section.update({ where: { id: section.id }, data: { draft: update(section.draft), ...(section.published ? { published: update(section.published) } : {}) } });
  console.log(`Updated home hero image: ${image.url}`);
}
main().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => db.$disconnect());
