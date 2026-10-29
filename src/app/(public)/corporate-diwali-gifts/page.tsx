import { Catalog, CatalogQuery } from '@/components/catalog';
export const metadata = {
  title: 'Corporate Diwali Gifts',
  description: 'Explore festive corporate hampers and request a personalized bulk gifting quote.',
  alternates: { canonical: '/corporate-diwali-gifts' },
};
export default async function Page({ searchParams }: { searchParams: Promise<CatalogQuery> }) {
  return <Catalog query={await searchParams} diwali />;
}
