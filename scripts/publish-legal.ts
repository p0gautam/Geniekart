import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

loadEnvConfig(process.cwd());
const db = new PrismaClient();
async function main() {
  const allowed = ['privacy-policy', 'terms', 'disclaimer'];
  const slugs = process.argv.slice(2).length ? process.argv.slice(2) : allowed;
  if (slugs.some((slug) => !allowed.includes(slug))) throw new Error('Unknown legal page');
  const previous = await db.page.findMany({ where: { slug: { in: slugs } }, include: { sections: true } });
  await mkdir('.local/backups', { recursive: true });
  await writeFile(`.local/backups/legal-${Date.now()}.json`, JSON.stringify(previous, null, 2));
  for (const slug of slugs) {
    const source = (await readFile(`content/legal/${slug}.md`, 'utf8')).replace(/\r\n/g, '\n');
    const title = source.split('\n')[0].replace(/^# /, '');
    const blocks = source.replace(/^# .*\n/, '').trim().split(/(?=^#{2,3} )/m);
    await db.$transaction(async (tx) => {
      const page = await tx.page.upsert({ where: { slug }, create: { slug, title, status: 'PUBLISHED' }, update: { title, status: 'PUBLISHED' } });
      await tx.section.deleteMany({ where: { pageId: page.id } });
      for (const [position, block] of blocks.entries()) {
        const heading = block.match(/^#{2,3} (.+)\n/);
        const content = { title: heading?.[1] || '', description: block.replace(/^#{2,3} .+\n/, '').trim(), cards: [] };
        await tx.section.create({ data: { pageId: page.id, kind: 'text', position, draft: content, published: content } });
      }
    });
    console.log(`${slug}: published ${blocks.length - 1} numbered sections plus introduction`);
  }
}
main().finally(() => db.$disconnect());
