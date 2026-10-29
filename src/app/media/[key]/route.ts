import { readFile } from 'node:fs/promises';
import { db } from '@/lib/db';
export async function GET(_: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!/^[a-f0-9-]{36}\.webp$/.test(key)) return new Response('Not found', { status: 404 });
  const media = await db.mediaAsset.findFirst({ where: { storageKey: key, url: '/media/' + key } });
  if (!media) return new Response('Not found', { status: 404 });
  try {
    const data = await readFile('public/uploads/' + key);
    return new Response(data, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
