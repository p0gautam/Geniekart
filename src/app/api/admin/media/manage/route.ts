import { authorize, assertOrigin, apiError } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
export async function POST(req: Request) {
  try {
    await assertOrigin(req);
    await authorize(['SUPER_ADMIN', 'EDITOR']);
    const { id, alt, action } = z
      .object({
        id: z.string(),
        alt: z.string().trim().min(1).max(500).optional(),
        action: z.enum(['update', 'delete']),
      })
      .parse(await req.json());
    if (action === 'update') {
      if (!alt) throw new Error('Alt text required');
      return Response.json(await db.mediaAsset.update({ where: { id }, data: { alt } }));
    }
    await db.$transaction(async (tx) => {
      const asset = await tx.mediaAsset.findUniqueOrThrow({
        where: { id },
        include: { _count: { select: { images: true, packageImages: true, categories: true } } },
      });
      if (Object.values(asset._count).some(Boolean)) throw new Error('Asset is in use');
      const [sections, settings, portfolio] = await Promise.all([
        tx.section.findMany(),
        tx.siteSettings.findMany(),
        tx.portfolio.findMany(),
      ]);
      if (JSON.stringify([sections, settings, portfolio]).includes(asset.url))
        throw new Error('Asset is in use');
      await tx.mediaAsset.delete({ where: { id } });
    });
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
