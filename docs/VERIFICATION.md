# Verification report

Current catalogue results supersede the historical catalogue counts below. See [CATALOG-REPLACEMENT.md](CATALOG-REPLACEMENT.md): 18 published listings, 14 individual products and four combos; catalogue checks and existing regression tests passed.

Verified locally on 17 October 2026. This report distinguishes executed checks from integrations awaiting real credentials.

## Executed checks

- PostgreSQL 17.5 initialized and restarted on loopback; Prisma initial migration applied successfully.
- Seed imported 48 draft Diwali products, four draft reference packages, 16 categories, a Diwali collection, homepage sections and FAQs.
- Strict TypeScript check passed.
- ESLint passed without errors or warnings.
- Production build passed, including all public, admin, API, media, sitemap and robots routes.
- The final build and complete integration suite also passed on Node.js 24 against the running production server. Protected dashboard, products, packages, sections, media, leads, settings and staff pages returned successful responses after login.
- Seven automated test cases passed. The integration case exercises many sequential assertions: anonymous admin/API rejection, staff login, Super Admin/Editor/Sales permissions, cross-origin rejection, category/product/package creation, image upload and serving, referenced-image deletion prevention, public publication, catalog search, enquiry persistence, idempotency, invalid quantity rejection, product context snapshots, lead notes/status, CSV access, slug redirects and reversal, archive visibility, package enquiries, CMS draft/published separation, protected draft previews and logout revocation.
- Browser: desktop homepage inspected against the supplied screenshot; shared modal opened; a test enquiry submitted through the actual form and success confirmation observed. Homepage inspected at 390 × 844 with the responsive header and stacked hero layout.
- Production-dependency audit: zero reported vulnerabilities after updating Nodemailer, Sharp and overriding Prisma configuration's `deepmerge-ts` to 8.0.2. Prisma generation/build were rechecked with that override.

## Remaining prerequisites / limitations

- No public hosting deployment was performed. Production database, domain/HTTPS, S3 credentials and SMTP credentials must be configured on the chosen host.
- SMTP delivery, S3 storage, GA4/GTM receipt and a real WhatsApp destination cannot be externally verified without the business's configuration. Local uploads and database persistence were exercised.
- The source image URLs from Stitch remain external dependencies. Their rights and long-term availability require review. Two additional generated images are labeled draft concepts. The supplied logo is preserved, but a usable logo is needed.
- Following the request for 20+ products, `npm run catalog:populate` publishes 24 curated gift concepts with images and descriptions; four are featured on the homepage. The remaining 24 products and four packages remain drafts. Concept descriptions disclose illustrative images and quotation-dependent contents, availability and pricing.
- Privacy policy and terms require the business's approved text before launch. Unverified client logos, reviews, metrics and delivery promises are not published.
- Full dependency audit still reports five development-only findings in the ESLint/fast-glob/micromatch/braces chain. The registry did not provide a patched `braces` release at verification time. Do not expose developer tooling as a public service; monitor for an upstream patch. Production-only audit is clean.
- Browser verification covered the homepage and main enquiry flow, not an exhaustive matrix of every browser/device. Admin/API behavior is covered by automated local integration checks; third-party delivery systems require staging tests.

## Design reconciliation

The homepage supplies the common typography, beige backgrounds, red buttons, lavender accents, rounded photography, paired hero/form, category cards, benefits/services, portfolio treatment, FAQ and footer. The Diwali page retains the four-column product grid on desktop and two-column layout on small screens with the homepage's common header/footer. Fabricated endorsements and metrics were removed rather than presented as genuine business claims.

## Windows notes

`pg_ctl` is used because launching `postgres.exe` directly under an administrative Windows token is rejected by PostgreSQL. Stop the dev server before `prisma generate` or a build that regenerates Prisma: Windows can lock the loaded query-engine DLL. A clean production build succeeded after releasing that lock. Use Node.js 22.13+ or Node 24 for deployment; the machine's default Node 20.18 is older than the declared supported toolchain.

## Category expansion

Added 60 published concept products, bringing the total to 84 across 16 categories. Every category has at least four products; the existing Diwali category retains 24. Verified 160 HTTP requests covering all 16 category pages, all 84 product pages and 60 local WebP illustrations, including category product links. All passed. TypeScript and lint checks also passed. Original vector illustrations are labeled product concepts; no supplier stock, price or material claims are inferred from them.
