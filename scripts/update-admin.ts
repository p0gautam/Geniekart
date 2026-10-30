import { loadEnvConfig } from '@next/env';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

loadEnvConfig(process.cwd());
async function main() {
  const currentEmail = z
    .string()
    .email()
    .parse(process.env.ADMIN_CURRENT_EMAIL?.trim().toLowerCase());
  const email = z.string().email().parse(process.env.ADMIN_EMAIL?.trim().toLowerCase());
  // Preserve the supplied password exactly, including internal spaces.
  const password = z
    .string()
    .min(14)
    .max(72)
    .refine((v) => Buffer.byteLength(v, 'utf8') <= 72)
    .parse(process.env.ADMIN_PASSWORD);
  const db = new PrismaClient();
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    await db.$transaction(async (tx) => {
      const user = await tx.adminUser.findUniqueOrThrow({ where: { email: currentEmail } });
      await tx.adminUser.update({ where: { id: user.id }, data: { email, passwordHash } });
      await tx.session.deleteMany({ where: { userId: user.id } });
    });
    const updated = await db.adminUser.findUniqueOrThrow({ where: { email } });
    if (!(await bcrypt.compare(password, updated.passwordHash)))
      throw new Error('Verification failed');
    console.log(
      'Admin credentials updated and verified. Previous sessions revoked; role unchanged.',
    );
  } finally {
    await db.$disconnect();
  }
}
main().catch(() => {
  console.error(
    'Admin update failed. Check the environment variables, existing account and database connection. No credentials printed.',
  );
  process.exitCode = 1;
});
