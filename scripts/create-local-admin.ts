import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import bcrypt from 'bcryptjs';
loadEnvConfig(process.cwd());
async function main() {
  if (!process.env.DATABASE_URL?.includes('127.0.0.1:54329'))
    throw new Error('This helper is only for the bundled local database.');
  if (existsSync('.local/admin-access.txt')) {
    console.log('Local admin access is already in .local/admin-access.txt.');
    return;
  }
  const db = new PrismaClient();
  try {
    const password = randomBytes(24).toString('base64url');
    const email = 'admin@geniekart.local';
    await db.adminUser.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(password, 12),
        name: 'Geniekart Local Admin',
        role: 'SUPER_ADMIN',
      },
    });
    mkdirSync('.local', { recursive: true });
    writeFileSync(
      '.local/admin-access.txt',
      `LOCAL DEVELOPMENT ONLY\nURL: http://localhost:3000/admin/login\nEmail: ${email}\nPassword: ${password}\n\nDo not deploy this account or commit this file.\n`,
      { mode: 0o600 },
    );
    console.log(
      'Local administrator created. Access details saved in ignored .local/admin-access.txt.',
    );
  } finally {
    await db.$disconnect();
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
