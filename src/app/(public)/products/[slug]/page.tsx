import { permanentRedirect } from 'next/navigation';
import { db } from '@/lib/db';
import { occasions } from '@/lib/occasions';
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await db.product.findUnique({
    where: { slug },
    include: { collections: { include: { collection: true } } },
  });
  if (item?.productType === 'combo' && item.status === 'PUBLISHED')
    permanentRedirect('/corporate-gifts?q=' + encodeURIComponent(item.name));
  const occasion = occasions.find((o) =>
    item?.collections.some((c) => c.collection.slug === o.slug),
  );
  permanentRedirect(occasion?.href || '/corporate-gifts');
}
