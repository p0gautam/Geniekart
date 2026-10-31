import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';

loadEnvConfig(process.cwd());
const db = new PrismaClient();
const tables = [
  'SiteSettings',
  'NavigationItem',
  'Page',
  'Section',
  'MediaAsset',
  'Category',
  'Collection',
  'Product',
  'ProductImage',
  'ProductAttribute',
  'ProductCollection',
  'GiftPackage',
  'PackageImage',
  'PackageItem',
  'Redirect',
  'Testimonial',
  'FAQ',
  'Portfolio',
];
async function main() {
  if (!process.env.DATABASE_URL?.includes('127.0.0.1:54329'))
    throw new Error('Local source required');
  const folder = '.local/production-content';
  await mkdir(folder, { recursive: true });
  const files: string[] = [];
  const counts: Record<string, number> = {};
  for (const table of tables) {
    const rows = await db.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT * FROM public."${table}"`,
    );
    counts[table] = rows.length;
    for (let offset = 0; offset < rows.length; offset += 10) {
      const json = JSON.stringify(rows.slice(offset, offset + 10)).replace(/'/g, "''");
      const file = `${folder}/${files.length}.sql`;
      await writeFile(
        file,
        `INSERT INTO public."${table}" SELECT * FROM json_populate_recordset(NULL::public."${table}", '${json}'::json) ON CONFLICT DO NOTHING;`,
      );
      files.push(file);
    }
  }
  // Create only the explicitly requested production account; never copy sessions or other users.
  const access = await readFile('.local/admin-access.txt', 'utf8');
  const email = access.match(/^Email: (.+)$/m)![1].trim();
  const password = access.match(/^Password: ([^\r\n]+)/m)![1];
  const user = JSON.stringify([
    {
      id: randomUUID(),
      email,
      passwordHash: await bcrypt.hash(password, 12),
      name: 'Geniekart Administrator',
      role: 'SUPER_ADMIN',
      active: true,
      createdAt: new Date().toISOString(),
    },
  ]).replace(/'/g, "''");
  const adminFile = `${folder}/${files.length}.sql`;
  await writeFile(
    adminFile,
    `INSERT INTO public."AdminUser" SELECT * FROM json_populate_recordset(NULL::public."AdminUser", '${user}'::json) ON CONFLICT DO NOTHING;`,
  );
  files.push(adminFile);
  await writeFile(`${folder}/manifest.json`, JSON.stringify({ files, counts }));
  console.log(JSON.stringify({ files: files.length, counts }));
}
main()
  .catch(() => {
    console.error('Export failed; credentials redacted.');
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
