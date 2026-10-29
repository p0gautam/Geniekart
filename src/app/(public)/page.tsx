import { occasions, illustrationNote } from '@/lib/occasions';
import Link from 'next/link';
import { db } from '@/lib/db';
import { pageSections, settings, productInclude } from '@/lib/data';
import { currentUser } from '@/lib/auth';
import { EnquiryForm, QuoteButton } from '@/components/enquiry';
import { ProductCard } from '@/components/cards';
export async function generateMetadata() {
  const s = await settings();
  return {
    title: { absolute: s.seoTitle },
    description: s.seoDescription,
    alternates: { canonical: process.env.SITE_URL || 'http://localhost:3000' },
    openGraph: { title: s.seoTitle, description: s.seoDescription },
    icons: s.favicon ? { icon: s.favicon } : undefined,
  };
}
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const query = await searchParams;
  const preview = query.preview === '1' && Boolean(await currentUser());
  const [sections, packages, faqs, testimonials, portfolio] = await Promise.all([
    pageSections('home', preview),
    db.product.findMany({
      where: {
        productType: 'combo',
        enquiryEnabled: true,
        status: preview ? { in: ['PUBLISHED', 'DRAFT'] } : 'PUBLISHED',
      },
      include: productInclude,
      orderBy: { position: 'asc' },
      take: 4,
    }),
    db.fAQ.findMany({ where: { status: 'PUBLISHED' }, orderBy: { position: 'asc' } }),
    db.testimonial.findMany({
      where: { status: 'PUBLISHED', verified: true },
      orderBy: { position: 'asc' },
    }),
    db.portfolio.findMany({
      where: { status: 'PUBLISHED', verified: true },
      orderBy: { position: 'asc' },
    }),
  ]);
  const hero = sections.find((s) => s.kind === 'hero')?.content;
  const catalogCopy = sections.find((s) => s.kind === 'catalog')?.content;
  const faqCopy = sections.find((s) => s.kind === 'faq')?.content;
  const reviewCopy = sections.find((s) => s.kind === 'reviews')?.content;
  return (
    <>
      {preview && (
        <div className="preview-banner">
          Admin preview — includes draft content and reference products.
        </div>
      )}
      {hero && (
        <section className="hero">
          <div className="container hero-grid">
            <div>
              <span className="hero-pill">
                <i />
                {hero.eyebrow}
              </span>
              <h1>
                {hero.title}
                <br />
                <em>{hero.subtitle || 'like never before.'}</em>
              </h1>
              <p className="hero-description">{hero.description}</p>
              <div className="hero-image">
                {hero.imageUrl && (
                  <img src={hero.imageUrl} alt={hero.imageAlt} fetchPriority="high" />
                )}
                <div>
                  <span>SIGNATURE GIFTING INSPIRATION</span>
                  <p>{hero.caption || 'A thoughtful welcome, beautifully boxed.'}</p>
                </div>
              </div>
            </div>
            <div className="quote-panel">
              <span className="eyebrow">YOUR CORPORATE GIFTING BRIEF</span>
              <h2>{hero.ctaLabel}</h2>
              <p>{hero.formDescription || 'Share a few details for a personalised proposal.'}</p>
              <EnquiryForm />
            </div>
          </div>
        </section>
      )}
      <section className="section muted" id="categories">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">
              {catalogCopy?.eyebrow || 'FOR EVERY OCCASION & EVERY TEAM'}
            </span>
            <h2>{catalogCopy?.title || 'Categories'}</h2>
            <p>
              {catalogCopy?.description ||
                'Find a thoughtful way to welcome, celebrate and appreciate.'}
            </p>
          </div>
          <div className="category-pills">
            {occasions.map((o) => (
              <Link key={o.slug} href={o.href}>
                {o.name}
              </Link>
            ))}
          </div>
          <p className="illustration-note">{illustrationNote}</p>
          {packages.length > 0 ? (
            <div className="product-grid">
              {packages.map((item) => (
                <ProductCard key={item.id} item={item} preview={preview} />
              ))}
            </div>
          ) : (
            <div className="collection-callout">
              <div>
                <span className="eyebrow">CURATED AROUND YOUR BRIEF</span>
                <h3>One box. So many ways to say thank you.</h3>
                <p>Explore our gifting categories or speak with us about a bespoke package.</p>
              </div>
              <QuoteButton>Explore Gift Packages →</QuoteButton>
            </div>
          )}
        </div>
      </section>
      {sections
        .filter((s) => !['hero', 'cta', 'catalog', 'faq', 'reviews'].includes(s.kind))
        .map((s) => (
          <section
            key={s.id}
            id={s.kind}
            className={'section ' + (s.kind === 'services' ? 'warm' : '')}
          >
            <div className="container">
              {s.kind === 'portfolio' ? (
                <div className="portfolio-panel">
                  <img src={s.content.imageUrl} alt={s.content.imageAlt} loading="lazy" />
                  <div>
                    <span className="eyebrow">{s.content.eyebrow}</span>
                    <h2>{s.content.title}</h2>
                    <p>{s.content.description}</p>
                    <QuoteButton className="button lavender">{s.content.ctaLabel}</QuoteButton>
                  </div>
                </div>
              ) : (
                <>
                  <div className="section-heading">
                    <span className="eyebrow">{s.content.eyebrow}</span>
                    <h2>{s.content.title}</h2>
                    <p>{s.content.description}</p>
                  </div>
                  <div className={s.kind === 'services' ? 'services-grid' : 'benefits-grid'}>
                    {s.content.cards.map((card, i) => (
                      <article className="service-card" key={i}>
                        <span className="service-icon">{['◇', '▣', '♧', '▤', '✧'][i % 5]}</span>
                        {card.imageUrl && (
                          <img src={card.imageUrl} alt={card.title} loading="lazy" />
                        )}
                        <h3>{card.title}</h3>
                        <p>{card.description}</p>
                        {card.href && !/^\/(products|packages)\//.test(card.href) ? (
                          <Link className="pill lavender" href={card.href}>
                            Explore →
                          </Link>
                        ) : (
                          <QuoteButton className="pill lavender">Know More</QuoteButton>
                        )}
                      </article>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        ))}
      {portfolio.length > 0 && (
        <section className="section container">
          <h2>Our Past Work</h2>
          <div className="product-grid">
            {portfolio.map((p) => (
              <article key={p.id}>
                <img src={p.imageUrl} alt={p.title} />
                <h3>{p.title}</h3>
                <p>{p.description}</p>
              </article>
            ))}
          </div>
        </section>
      )}
      {testimonials.length > 0 && (
        <section className="section muted">
          <div className="container">
            <div className="section-heading">
              <h2>{reviewCopy?.title || 'What Our Clients Say'}</h2>
              <p>{reviewCopy?.description || 'Verified corporate reviews'}</p>
            </div>
            <div className="benefits-grid">
              {testimonials.map((t) => (
                <blockquote className="service-card" key={t.id}>
                  <p>“{t.quote}”</p>
                  <strong>{t.name}</strong>
                  <small>{t.company}</small>
                </blockquote>
              ))}
            </div>
          </div>
        </section>
      )}
      <section className="section founder-section" id="talk-to-akhil" aria-labelledby="founder-title">
        <div className="container">
          <div className="founder-panel">
            <div className="founder-portrait">
              <img src="/images/akhil-contact-reference.png" alt="Akhil Bansal" loading="lazy" />
            </div>
            <div className="founder-content">
              <span className="eyebrow">A PERSONAL APPROACH TO CORPORATE GIFTING</span>
              <h2 id="founder-title">Speak directly with Akhil Bansal</h2>
              <p className="founder-intro">Let’s make your next Geniekart gift meaningful.</p>
              <p>Great gifting starts with understanding your people. Whether you’re welcoming new colleagues, thanking clients or celebrating a milestone, share your occasion, budget and quantities with Akhil to explore the right gifts for your business.</p>
              <p>From thoughtful gift combinations to branding and packaging, let’s plan a Geniekart experience that feels personal to your team and true to your brand.</p>
              <div className="founder-contacts">
                <a href="mailto:akhilbansal@genosub.com"><span>Email</span><strong>akhilbansal@genosub.com</strong></a>
                <a href="tel:+917976682043"><span>Phone</span><strong>+91 79766 82043</strong></a>
              </div>
              <div className="founder-actions">
                <a className="button" href="https://wa.me/917976682043?text=Hi%20Akhil%2C%20I%27d%20like%20to%20discuss%20corporate%20gifting%20with%20Geniekart." target="_blank" rel="noopener noreferrer">WhatsApp Akhil</a>
                <QuoteButton className="button lavender">Plan My Gifts</QuoteButton>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="section container faq" id="faq">
        <div className="section-heading">
          <span className="eyebrow">{faqCopy?.eyebrow || 'FREQUENTLY ASKED QUESTIONS'}</span>
          <h2>{faqCopy?.title || 'Have questions about minimum orders or timelines?'}</h2>
        </div>
        {faqs.map((f) => (
          <details key={f.id}>
            <summary>
              {f.question}
              <span>+</span>
            </summary>
            <p>{f.answer}</p>
          </details>
        ))}
      </section>
      {sections
        .filter((s) => s.kind === 'cta')
        .map((s) => (
          <section className="final-cta" key={s.id}>
            <div className="container">
              <span className="eyebrow">{s.content.eyebrow}</span>
              <h2>{s.content.title}</h2>
              <p>{s.content.description}</p>
              <QuoteButton>{s.content.ctaLabel}</QuoteButton>
            </div>
          </section>
        ))}
    </>
  );
}

