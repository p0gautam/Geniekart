import { loadEnvConfig } from '@next/env';
import { PrismaClient, Prisma } from '@prisma/client';

loadEnvConfig(process.cwd());
const db = new PrismaClient();
async function main() {
  const record = await db.siteSettings.findUniqueOrThrow({ where: { id: 'global' } });
  const data = record.data as Prisma.JsonObject;
  await db.siteSettings.update({ where: { id: 'global' }, data: { data: { ...data, gtmId: 'GTM-P82TX3LD' } } });
  console.log('Configured GTM-P82TX3LD in site settings.');
}
main().finally(() => db.$disconnect());
