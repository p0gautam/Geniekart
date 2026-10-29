'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { occasions } from '@/lib/occasions';

export function HeaderNavigation({ mobile = false }: { mobile?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [gifting, setGifting] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  function close() {
    setExpanded(false);
    setGifting(false);
  }
  return (
    <div
      className={mobile ? 'mobile-menu' : 'desktop-nav'}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          if (gifting) {
            setGifting(false);
            trigger.current?.focus();
          } else {
            close();
            menuTrigger.current?.focus();
          }
        }
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) close();
      }}
    >
      {mobile && (
        <button
          ref={menuTrigger}
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={expanded}
          aria-controls="mobile-navigation"
          onClick={() => setExpanded(!expanded)}
        >
          ☰
        </button>
      )}
      {(!mobile || expanded) && (
        <nav
          id={mobile ? 'mobile-navigation' : 'desktop-navigation'}
          aria-label={mobile ? 'Mobile navigation' : 'Main navigation'}
        >
          <Link href="/" onClick={close}>
            Home
          </Link>
          <div className="gifting-nav">
            <button
              type="button"
              ref={trigger}
              aria-expanded={gifting}
              aria-controls={mobile ? 'mobile-gifting' : 'desktop-gifting'}
              onClick={() => setGifting(!gifting)}
            >
              Gifting
              <svg className="gifting-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {gifting && (
              <div className="gifting-options" id={mobile ? 'mobile-gifting' : 'desktop-gifting'}>
                <Link href="/corporate-gifts" onClick={close}>
                  Corporate Gifts
                </Link>
                {occasions.map((item) => (
                  <Link key={item.slug} href={item.href} onClick={close}>
                    {item.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link href="/#benefits" onClick={close}>
            Why GenieKart
          </Link>
          <Link href="/contact" onClick={close}>
            Contact Us
          </Link>
        </nav>
      )}
    </div>
  );
}
