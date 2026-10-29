import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';
import { assertOrigin, rateLimit, consumeRate, hash, createSession, apiError } from '@/lib/auth';
export async function POST(req: Request) {
  try {
    await assertOrigin(req);
    await rateLimit('login', 20, 900000);
    const data = z
      .object({ email: z.string().email().max(254), password: z.string().min(1).max(200) })
      .parse(await req.json());
    const email = data.email.toLowerCase();
    await consumeRate('login-account:' + hash(email), 8, 900000);
    const user = await db.adminUser.findUnique({ where: { email } });
    const valid = await bcrypt.compare(
      data.password,
      user?.passwordHash || '$2b$12$C6UzMDM.H6dfI/f/IKcEe.6BCK6ktHCaMuBqs0vDqLDb5HR3u9uGO',
    );
    if (!user || !user.active || !valid)
      return Response.json({ error: 'Invalid email or password.' }, { status: 401 });
    await createSession(user.id);
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
