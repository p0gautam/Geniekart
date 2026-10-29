import { notFound } from 'next/navigation';
import { occasions } from '@/lib/occasions';
import { Catalog, CatalogQuery } from '@/components/catalog';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const occasion = occasions.find((o) => o.slug === slug);
  return { title: occasion?.name, alternates: { canonical: occasion?.href } };
}
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<CatalogQuery>;
}) {
  const { slug } = await params;
  if (!occasions.some((o) => o.slug === slug)) notFound();
  return <Catalog query={await searchParams} collectionSlug={slug} />;
}
