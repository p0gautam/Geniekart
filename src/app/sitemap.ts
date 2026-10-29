import { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { occasions } from '@/lib/occasions';
export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL || 'http://localhost:3000';
  const pages = await db.page.findMany({
    where: {
      status: 'PUBLISHED',
      slug: { notIn: ['home', 'contact', 'corporate-gifts', 'corporate-diwali-gifts'] },
    },
  });
  return [
    ...['', '/corporate-gifts', '/contact', ...occasions.map((o) => o.href)].map((p) => ({
      url: base + p,
    })),
    ...pages.map((p) => ({ url: base + '/' + p.slug, lastModified: p.updatedAt })),
  ];
}
