import { authorize, assertOrigin, apiError } from '@/lib/auth';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
export async function POST(req: Request) {
  try {
    await assertOrigin(req);
    const actor = await authorize(['SUPER_ADMIN']);
    const { id, password, ...data } = z
      .object({
        id: z.string().optional(),
        name: z.string().min(2).max(100),
        email: z.string().email(),
        role: z.enum(['SUPER_ADMIN', 'EDITOR', 'SALES']),
        active: z.boolean(),
        password: z.string().min(14).max(200).optional(),
      })
      .parse(await req.json());
    if (id === actor.id && (data.role !== 'SUPER_ADMIN' || !data.active))
      throw new Error('Cannot remove your own administrative access');
    if (!id && !password) throw new Error('Password required');
    const payload = {
      ...data,
      email: data.email.toLowerCase(),
      ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}),
    };
    await db.$transaction(async (tx) => {
      const user = id
        ? await tx.adminUser.update({ where: { id }, data: payload })
        : await tx.adminUser.create({ data: { ...payload, passwordHash: payload.passwordHash! } });
      if (id) await tx.session.deleteMany({ where: { userId: id } });
      await tx.auditLog.create({
        data: { userId: actor.id, action: 'MANAGE_USER', entity: 'users', entityId: user.id },
      });
    });
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
