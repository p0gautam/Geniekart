import Link from 'next/link';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { productInclude } from '@/lib/data';
import { ProductCard } from './cards';
import { QuoteButton } from './enquiry';
import { occasions, illustrationNote } from '@/lib/occasions';
export type CatalogQuery = {
  q?: string;
  occasion?: string;
  category?: string;
  sort?: string;
  page?: string;
  preview?: string;
};
export async function Catalog({
  query,
  diwali = false,
  collectionSlug,
}: {
  query: CatalogQuery;
  diwali?: boolean;
  collectionSlug?: string;
}) {
  const selected = occasions.find(
    (o) => o.slug === (diwali ? 'corporate-diwali-gifts' : collectionSlug || query.occasion),
  );
  const where: Prisma.ProductWhereInput = {
    status: 'PUBLISHED',
    productType: 'combo',
    enquiryEnabled: true,
    ...(selected
      ? { collections: { some: { collection: { slug: selected.slug, status: 'PUBLISHED' } } } }
      : {}),
    ...(query.q?.trim()
      ? {
          OR: [
            { name: { contains: query.q.trim().slice(0, 200), mode: 'insensitive' } },
            { shortDescription: { contains: query.q.trim().slice(0, 200), mode: 'insensitive' } },
          ],
        }
      : {}),
  };
  const total = await db.product.count({ where });
  const pages = Math.max(1, Math.ceil(total / 12));
  const page = Math.min(pages, Math.max(1, Math.floor(Number(query.page) || 1)));
  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    query.sort === 'name'
      ? [{ name: 'asc' }, { id: 'asc' }]
      : query.sort === 'newest'
        ? [{ createdAt: 'desc' }, { id: 'asc' }]
        : [{ position: 'asc' }, { id: 'asc' }];
  const products = await db.product.findMany({
    where,
    include: productInclude,
    orderBy,
    take: 12,
    skip: (page - 1) * 12,
  });
  const title = selected?.name || 'Corporate Gifts';
  const pageLink = (p: number) =>
    '?' +
    new URLSearchParams({
      q: query.q || '',
      occasion: selected?.slug || '',
      sort: query.sort || 'featured',
      page: String(p),
    });
  return (
    <div className="container">
      <div className="breadcrumbs">
        <Link href="/">Home</Link> / {title}
      </div>
      <div className="catalog-head">
        <span className="eyebrow">THOUGHTFUL GIFTS FOR YOUR BUSINESS</span>
        <h1>{title}</h1>
        <p>Explore complete gift sets for your people, milestones and celebrations.</p>
      </div>
      <form className="catalog-toolbar" action="/corporate-gifts">
        <label>
          Search gifts
          <input name="q" defaultValue={query.q} placeholder="Search gift combos…" />
        </label>
        <label>
          Occasion
          <select name="occasion" defaultValue={selected?.slug || ''}>
            <option value="">All occasions</option>
            {occasions.map((o) => (
              <option key={o.slug} value={o.slug}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sort by
          <select name="sort" defaultValue={query.sort || 'featured'}>
            <option value="featured">Featured order</option>
            <option value="name">Name A–Z</option>
            <option value="newest">Newest</option>
          </select>
        </label>
        <button className="button" type="submit">
          Find Gifts
        </button>
      </form>
      <p className="catalog-count">{total} gift combos</p>
      <p className="illustration-note">{illustrationNote}</p>
      {products.length ? (
        <div className="product-grid catalog-grid">
          {products.map((item) => (
            <ProductCard key={item.id} item={item} occasion={selected?.name} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No matching gift combos found.</h2>
          <p>Try another name or occasion, or tell us about your gifting brief.</p>
          <QuoteButton>Request a Curated Quote</QuoteButton>
        </div>
      )}
      <nav className="pagination" aria-label="Pagination">
        {page > 1 && <Link href={pageLink(page - 1)}>← Previous</Link>}
        <span>
          Page {page} of {pages}
        </span>
        {page < pages && <Link href={pageLink(page + 1)}>Next →</Link>}
      </nav>
    </div>
  );
}
