import { loadEnvConfig } from '@next/env';
import { Prisma, PrismaClient } from '@prisma/client';
import { mkdir, copyFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';

loadEnvConfig(process.cwd());
const db = new PrismaClient();
async function main() {
  const source = process.argv[2];
  if (!source) throw new Error('Pass the supplied logo image path.');
  const settings = await db.siteSettings.findUniqueOrThrow({ where: { id: 'global' } });
  await mkdir('public/uploads', { recursive: true });
  await mkdir('references', { recursive: true });
  await copyFile(source, 'references/approved-geniekart-logo.png');
  const key = `${randomUUID()}.webp`;
  // Preserve original dimensions and transparency; lossless web format for the media route.
  const info = await sharp(source).webp({ lossless: true }).toFile(`public/uploads/${key}`);
  const url = `/media/${key}`;
  await db.$transaction([
    db.mediaAsset.create({
      data: {
        url,
        storageKey: key,
        alt: 'Geniekart logo',
        mime: 'image/webp',
        width: info.width,
        height: info.height,
      },
    }),
    db.siteSettings.update({
      where: { id: 'global' },
      data: {
        data: { ...(settings.data as Prisma.JsonObject), logo: url },
      },
    }),
  ]);
  console.log(JSON.stringify({ logo: url, width: info.width, height: info.height }));
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
