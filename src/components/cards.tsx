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
  const optimizedUrl = url?.startsWith('/assets/') && url.endsWith('-concept.png')
    ? url.replace('.png', '-1024.webp')
    : url;
  const responsive = optimizedUrl?.startsWith('/images/combos/') || optimizedUrl?.startsWith('/assets/');
  return (
    <article className="product-card">
      <QuoteButton className="card-main" context={context} placement="combo_card" ariaLabel={`Enquire about ${item.name}`}>
        <div className="product-image">
          {optimizedUrl ? (
            <img
              src={optimizedUrl}
              alt={item.images[0].media.alt || item.name}
              loading="lazy"
              width={1024}
              height={1024}
              srcSet={
                responsive
                  ? `${optimizedUrl.replace('-1024', '-480')} 480w, ${optimizedUrl.replace('-1024', '-768')} 768w, ${optimizedUrl} 1024w`
                  : undefined
              }
              sizes="(max-width: 767px) 46vw, (max-width: 900px) 45vw, 25vw"
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
          placement="combo_get_quote"
          ariaLabel={`Get Quote for ${item.name}`}
        >
          Get Quote
        </QuoteButton>
      </div>
    </article>
  );
}
