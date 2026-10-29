import { cookies, headers } from 'next/headers';
import { createHash, randomBytes } from 'node:crypto';
import { Role } from '@prisma/client';
import { db } from './db';
export const hash = (s: string) => createHash('sha256').update(s).digest('hex');
export const cookieName = 'geniekart_admin';
export async function currentUser() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hash(token) },
    include: { user: true },
  });
  return session && session.expiresAt > new Date() && session.user.active ? session.user : null;
}
export async function authorize(roles: Role[] = ['SUPER_ADMIN', 'EDITOR', 'SALES']) {
  const user = await currentUser();
  if (!user) throw new Error('UNAUTHORIZED');
  if (!roles.includes(user.role)) throw new Error('FORBIDDEN');
  return user;
}
export async function createSession(userId: string) {
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 8 * 60 * 60 * 1000);
  await db.session.create({ data: { tokenHash: hash(token), userId, expiresAt: expires } });
  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    expires,
  });
}
export async function assertOrigin(req: Request) {
  const origin = req.headers.get('origin');
  const expected = new URL(process.env.SITE_URL || 'http://localhost:3000').origin;
  if (origin !== expected) throw new Error('FORBIDDEN');
}
export async function rateLimit(scope: string, limit: number, windowMs: number) {
  const h = await headers();
  const ip =
    process.env.TRUST_PROXY === 'true'
      ? h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
      : 'local';
  return consumeRate(scope + ':' + hash(ip), limit, windowMs);
}
export async function consumeRate(key: string, limit: number, windowMs: number) {
  const expires = new Date(Date.now() + windowMs);
  const rows = await db.$queryRaw<
    { count: number }[]
  >`INSERT INTO "RateLimit" ("key","count","expiresAt") VALUES (${key},1,${expires}) ON CONFLICT ("key") DO UPDATE SET "count"=CASE WHEN "RateLimit"."expiresAt" < NOW() THEN 1 ELSE "RateLimit"."count"+1 END, "expiresAt"=CASE WHEN "RateLimit"."expiresAt" < NOW() THEN ${expires} ELSE "RateLimit"."expiresAt" END RETURNING "count"`;
  if (rows[0].count > limit) throw new Error('RATE_LIMIT');
}
export function apiError(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  const status =
    message === 'UNAUTHORIZED'
      ? 401
      : message === 'FORBIDDEN'
        ? 403
        : message === 'RATE_LIMIT'
          ? 429
          : 400;
  return Response.json(
    {
      error:
        status === 401
          ? 'Please sign in.'
          : status === 403
            ? 'This action is not permitted.'
            : status === 429
              ? 'Too many attempts. Please try again later.'
              : 'Unable to save. Check the fields and unique slugs/SKUs.',
    },
    { status },
  );
}
