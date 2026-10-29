import { Catalog, CatalogQuery } from '@/components/catalog';
export const metadata = { title: 'Corporate Gifts', alternates: { canonical: '/corporate-gifts' } };
export default async function Page({ searchParams }: { searchParams: Promise<CatalogQuery> }) {
  return <Catalog query={await searchParams} />;
}
