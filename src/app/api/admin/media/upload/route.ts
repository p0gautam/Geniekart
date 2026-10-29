import { authorize, assertOrigin, apiError } from '@/lib/auth';
import { db } from '@/lib/db';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
export async function POST(req: Request) {
  try {
    await assertOrigin(req);
    await authorize(['SUPER_ADMIN', 'EDITOR']);
    const data = await req.formData();
    const file = data.get('file');
    const alt = String(data.get('alt') || '').trim();
    if (!(file instanceof File) || file.size > 8 * 1024 * 1024 || !alt || alt.length > 500)
      return Response.json(
        { error: 'Choose an image under 8 MB and provide alt text.' },
        { status: 422 },
      );
    const bytes = Buffer.from(await file.arrayBuffer());
    const metadata = await sharp(bytes, { limitInputPixels: 40000000 }).metadata();
    if (!['jpeg', 'png', 'webp'].includes(metadata.format || ''))
      throw new Error('Unsupported image type');
    const output = await sharp(bytes, { limitInputPixels: 40000000 })
      .rotate()
      .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer({ resolveWithObject: true });
    const key = randomUUID() + '.webp';
    let url = '/media/' + key;
    if (process.env.MEDIA_DRIVER === 's3') {
      if (!process.env.S3_BUCKET || !process.env.S3_PUBLIC_URL)
        throw new Error('Storage not configured');
      const s3 = new S3Client({
        region: process.env.S3_REGION || 'auto',
        endpoint: process.env.S3_ENDPOINT || undefined,
      });
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: key,
          Body: output.data,
          ContentType: 'image/webp',
        }),
      );
      url = process.env.S3_PUBLIC_URL.replace(/\/$/, '') + '/' + key;
    } else {
      await mkdir('public/uploads', { recursive: true });
      await writeFile('public/uploads/' + key, output.data);
    }
    return Response.json(
      await db.mediaAsset.create({
        data: { url, storageKey: key, alt, width: output.info.width, height: output.info.height },
      }),
    );
  } catch (e) {
    return apiError(e);
  }
}
