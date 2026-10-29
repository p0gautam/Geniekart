'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { QuoteButton, track } from './enquiry';
import type { IncludedProduct } from '@/lib/combo';
export function MobileMenu({ items }: { items: { id: string; label: string; href: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mobile-menu">
      <button aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen(!open)}>
        ☰
      </button>
      {open && (
        <nav>
          {items.map((i) => (
            <Link key={i.id} href={i.href} onClick={() => setOpen(false)}>
              {i.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
export function WhatsApp({
  href,
  name,
  floating = false,
}: {
  href: string;
  name?: string;
  floating?: boolean;
}) {
  return (
    <a
      className={floating ? 'whatsapp-float' : 'button outline'}
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={() => track('whatsapp_click', { item_name: name || 'general' })}
    >
      {floating ? '◉ WhatsApp' : 'Chat on WhatsApp ↗'}
    </a>
  );
}
export function Gallery({
  images,
  name,
}: {
  images: { media: { url: string; alt: string } }[];
  name: string;
}) {
  const [index, setIndex] = useState(0);
  return (
    <div>
      <div className="gallery-main">
        {images[index] ? (
          <img src={images[index].media.url} alt={images[index].media.alt || name} />
        ) : (
          <div className="image-placeholder">Photography coming soon</div>
        )}
      </div>
      <div className="thumbnails">
        {images.map((image, i) => (
          <button
            key={i}
            aria-label={`View image ${i + 1}`}
            aria-pressed={index === i}
            onClick={() => setIndex(i)}
          >
            <img src={image.media.url} alt="" />
          </button>
        ))}
      </div>
    </div>
  );
}
export function DetailActions({
  id,
  name,
  isPackage,
  packaging,
  minimumOrder = 1,
  includedProducts = [],
  isCombo = false,
}: {
  id: string;
  name: string;
  isPackage: boolean;
  packaging: string[];
  minimumOrder?: number;
  includedProducts?: IncludedProduct[];
  isCombo?: boolean;
}) {
  const [quantity, setQuantity] = useState(minimumOrder);
  const [pack, setPack] = useState('');
  useEffect(() => track('view_item', { item_id: id, item_name: name }), [id, name]);
  return (
    <div className="detail-actions">
      <label>
        Number of gifts
        <input
          type="number"
          min={minimumOrder}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />
      </label>
      {packaging.length > 0 && (
        <label>
          Packaging preference
          <select value={pack} onChange={(e) => setPack(e.target.value)}>
            <option value="">Discuss with our team</option>
            {packaging.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
      )}
      <QuoteButton
        context={{
          name,
          quantity,
          packaging: pack,
          includedProducts,
          isCombo,
          ...(isPackage ? { packageId: id } : { productId: id }),
        }}
      >
        Get Quote →
      </QuoteButton>
    </div>
  );
}
export function ProductLink({
  href,
  id,
  children,
}: {
  href: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} onClick={() => track('select_item', { item_id: id })}>
      {children}
    </Link>
  );
}
