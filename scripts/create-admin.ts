import { loadEnvConfig } from '@next/env';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
loadEnvConfig(process.cwd());
async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 14)
    throw new Error(
      'Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 14 characters) in the environment.',
    );
  const db = new PrismaClient();
  try {
    await db.adminUser.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(password, 12),
        name: 'Administrator',
        role: 'SUPER_ADMIN',
      },
    });
    console.log('Administrator created. Remove ADMIN_PASSWORD from your environment.');
  } finally {
    await db.$disconnect();
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
