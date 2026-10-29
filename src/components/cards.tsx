import { QuoteButton } from './enquiry';
import { comboContents } from '@/lib/combo';
export type CardItem = {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  description: string;
  status: string;
  productType?: string;
  includedProducts?: unknown;
  enquiryEnabled?: boolean;
  collections?: { collection: { name: string; status: string } }[];
  images: { media: { url: string; alt: string } }[];
};
export function ProductCard({
  item,
  occasion,
  isPackage = false,
}: {
  item: CardItem;
  occasion?: string;
  isPackage?: boolean;
  preview?: boolean;
}) {
  if (item.productType !== 'combo' || item.enquiryEnabled === false) return null;
  const context = {
    name: item.name,
    isCombo: true,
    includedProducts: comboContents(item.includedProducts),
    selectedOccasion:
      occasion ||
      item.collections
        ?.filter((c) => c.collection.status === 'PUBLISHED')
        .map((c) => c.collection.name)
        .join(', '),
    ...(isPackage ? { packageId: item.id } : { productId: item.id }),
  };
  const url = item.images[0]?.media.url;
  const responsive = url?.startsWith('/images/combos/');
  return (
    <article className="product-card">
      <QuoteButton className="card-main" context={context} ariaLabel={`Enquire about ${item.name}`}>
        <div className="product-image">
          {url ? (
            <img
              src={url}
              alt={item.images[0].media.alt || item.name}
              loading="lazy"
              width={1024}
              height={1024}
              srcSet={
                responsive
                  ? `${url.replace('-1024', '-480')} 480w, ${url.replace('-1024', '-768')} 768w, ${url} 1024w`
                  : undefined
              }
              sizes="(max-width: 600px) 90vw, (max-width: 1000px) 45vw, 25vw"
            />
          ) : (
            <div className="image-placeholder">Photography coming soon</div>
          )}
        </div>
        <div className="card-copy">
          <h3>{item.name}</h3>
          <p>{item.shortDescription}</p>
        </div>
      </QuoteButton>
      <div className="card-footer">
        <span>Customisation on enquiry</span>
        <QuoteButton
          className="button quote-card-button"
          context={context}
          ariaLabel={`Get Quote for ${item.name}`}
        >
          Get Quote
        </QuoteButton>
      </div>
    </article>
  );
}
