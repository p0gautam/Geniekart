import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { assertOrigin, cookieName, hash, apiError } from '@/lib/auth';
export async function POST(req: Request) {
  try {
    await assertOrigin(req);
    const c = await cookies();
    const token = c.get(cookieName)?.value;
    if (token) await db.session.deleteMany({ where: { tokenHash: hash(token) } });
    c.delete(cookieName);
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
