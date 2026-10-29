import Link from 'next/link';
import { db } from '@/lib/db';
import { settings, whatsappUrl } from '@/lib/data';
import { EnquiryProvider, QuoteButton } from './enquiry';
import { WhatsApp } from './client';
import { HeaderNavigation } from './header-navigation';
import { occasions } from '@/lib/occasions';
export async function PublicLayout({ children }: { children: React.ReactNode }) {
  const s = await settings();
  const navigation = await db.navigationItem.findMany({ orderBy: { position: 'asc' } });
  const footer = navigation.filter((n) => n.location === 'footer');
  return (
    <EnquiryProvider>
      <div style={{ '--red': s.primaryColor } as React.CSSProperties}>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {s.announcement && <div className="announcement">{s.announcement}</div>}
        <header className="site-header">
          <div className="container nav-row">
            <Link href="/" className="brand" aria-label={s.companyName + ' home'}>
              {s.logo ? (
                <>
                  <img src={s.logo} alt="" />
                  <span>{s.companyName.toLowerCase()}</span>
                </>
              ) : (
                <>
                  <span className="brand-mark">
                    g<span>✦</span>
                  </span>
                  <span>
                    {s.companyName.toLowerCase()}
                    <small>CORPORATE GIFTING</small>
                  </span>
                </>
              )}
            </Link>
            <HeaderNavigation />
            <QuoteButton>{s.cta}</QuoteButton>
            <HeaderNavigation mobile />
          </div>
        </header>
        <main id="main">{children}</main>
        <footer>
          <div className="container footer-grid">
            <div>
              <Link href="/" className="brand">
                {s.companyName}
              </Link>
              <p>{s.footerText}</p>
            </div>
            <div>
              <h4>THE COMPANY</h4>
              {footer.map((i) => (
                <Link key={i.id} href={i.href}>
                  {i.label}
                </Link>
              ))}
              <Link href="/contact">Contact</Link>
              <Link href="/privacy-policy">Privacy Policy</Link>
              <Link href="/terms">Terms & Conditions</Link>
              <Link href="/disclaimer">Disclaimer</Link>
            </div>
            <div>
              <h4>SOLUTIONS</h4>
              <Link href="/corporate-gifts">Corporate Gifts</Link>
              {occasions.map((o) => (
                <Link key={o.slug} href={o.href}>
                  {o.name}
                </Link>
              ))}
            </div>
            <div>
              <h4>DIRECT SUPPORT</h4>
              <QuoteButton className="text-button">Talk to a gifting specialist →</QuoteButton>
              {s.email && <a href={'mailto:' + s.email}>{s.email}</a>}
              {s.phone && <a href={'tel:' + s.phone}>{s.phone}</a>}
              <p>{s.address}</p>
              {s.socials.map((i) => (
                <a key={i.label} href={i.url} rel="noreferrer" target="_blank">
                  {i.label}
                </a>
              ))}
            </div>
          </div>
          <div className="container footer-bottom">
            © {new Date().getFullYear()} {s.companyName}. All rights reserved.
            <span>Thoughtful gifts. Meaningful connections.</span>
          </div>
        </footer>
        {s.whatsapp && <WhatsApp href={whatsappUrl(s.whatsapp)} floating />}
      </div>
    </EnquiryProvider>
  );
}
