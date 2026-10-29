import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
loadEnvConfig(process.cwd());
const db = new PrismaClient();
async function main() {
  const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/geniekart_list`, {
    method: 'POST',
    headers: { apikey: process.env.SUPABASE_SECRET_KEY || '', 'Content-Type': 'application/json' },
    body: '{}',
  });
  console.log('Supabase REST authenticated:', response.ok, 'HTTP', response.status);
  if (response.ok) console.log('Remote enquiry count:', (await response.json()).total);
  console.log('Preserved local enquiries:', await db.enquiry.count());
  console.log('SMTP configured:', Boolean(process.env.SMTP_HOST));
  console.log(
    'Admin role counts:',
    await db.adminUser.groupBy({ by: ['role', 'active'], _count: true }),
  );
}
main()
  .catch(() => {
    console.error('Configuration check failed (details redacted).');
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
