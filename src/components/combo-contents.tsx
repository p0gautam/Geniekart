import type { IncludedProduct } from '@/lib/combo';
export function ComboContents({
  items,
  packagingDetails,
}: {
  items: IncludedProduct[];
  packagingDetails: string;
}) {
  return (
    <section className="section" aria-labelledby="combo-contents-title">
      <h2 id="combo-contents-title">What&apos;s Inside the Box</h2>
      <p>
        One predefined selection. AI-generated representative images; final appearance and packaging
        are confirmed with your quotation.
      </p>
      <div className="product-grid combo-contents">
        {items.map((item, index) => (
          <article className="product-card" key={`${item.displayName}-${index}`}>
            <div className="product-image">
              <img
                src={item.image}
                alt={`${item.displayName} — AI-generated representative image`}
                loading="lazy"
              />
            </div>
            <div className="card-copy">
              <h3>{item.displayName}</h3>
              <p>Quantity: {item.quantity}</p>
              <p>{item.description}</p>
            </div>
          </article>
        ))}
      </div>
      {packagingDetails && <p className="combo-packaging">{packagingDetails}</p>}
    </section>
  );
}
