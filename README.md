# Geniekart

A database-backed B2B gifting application built with Next.js App Router, React, strict TypeScript, Tailwind CSS, PostgreSQL, Prisma, Zod and React Hook Form. There is no customer account, cart, checkout or payment flow.

## Local preview

Use Node.js 22.13+ (Node 24 LTS recommended). From this directory:

```powershell
npm ci
npm run db:local
npm run db:generate
npm run db:migrate
npm run db:seed
npm run catalog:backup
# Pass the backup path printed above:
npm run catalog:replace -- .local/backups/catalog-<timestamp>.json
npm run admin:local
npm run dev
```

Open **http://localhost:3000** and **http://localhost:3000/admin/login**. Use `localhost`, matching `SITE_URL`, rather than `127.0.0.1` when submitting forms. The random local administrator credentials are in `.local/admin-access.txt`. That file, `.env`, uploaded files and database data are ignored by Git. No fixed/default password is in source.

Keep `npm run db:local` running in its own terminal, then run the remaining commands in a second terminal. The Windows helper runs `pg_ctl`, which starts PostgreSQL with the restricted token it requires. Data persists in `.local/postgres`. Stop it with Ctrl+C or `npm run db:stop` on Windows. This bundled database is for development only.

For an existing PostgreSQL server, skip `db:local`, copy `.env.example` to `.env`, and set `DATABASE_URL`. Never overwrite an existing environment file containing your settings.

## What is included

- Shared announcement, sticky header, dropdown navigation, mobile menu, footer and quote modal.
- Homepage retaining the supplied layout, fonts, warm neutrals, red accents and lavender CTAs.
- Corporate and Diwali catalogs with database search, category filters, sorting and pagination.
- Product galleries, specifications, quantity/packaging preferences, related products and individual URLs.
- Packages composed from catalog products, with per-item quantities and independent publishing.
- Database-persisted enquiries, product/package snapshots, UTM attribution, consent timestamps, idempotency, honeypot and PostgreSQL-backed rate limits.
- Admin dashboard, product/package/category/collection editors, structured CMS, media library, lead statuses/notes/export, global settings and staff roles.
- Hashed passwords, random opaque sessions hashed in the database, eight-hour expiry, HttpOnly/SameSite cookies, secure production cookies, origin checks and server-side authorization.
- Dynamic SEO titles/descriptions, canonical URLs, Open Graph, Product/Breadcrumb structured data, sitemap, robots rules, 404 pages and product/package slug redirects.
- Optional SMTP notifications and GA4/GTM hooks. Events contain product context only; contact details are not sent to analytics.

## Content and publishing

The public catalogue contains exactly **18 listings: 14 individual products and four predefined corporate gift combos**, across eight categories. The previous dummy catalogue is backed up and archived; old URLs redirect to current categories. Details and verification are in [docs/CATALOG-REPLACEMENT.md](docs/CATALOG-REPLACEMENT.md).

New images are clearly labelled temporary placeholders pending approved product photography. The supplied red logo and wordmark remain in place. Products have no invented prices, minimum quantities or inventory claims.

1. In **Media**, upload images and set meaningful alt text. Select images in product/package editors in the desired gallery order. For CMS sections/settings, copy an image URL from Media.
2. In **Products**, enter verified descriptions, SKU, unique slug, specifications, quantities and optional price. Select category and collections; choose PUBLISHED when ready. ARCHIVED removes a product from the public catalog while preserving enquiries.
3. In **Products**, select the combo type and edit Combo contents, linked individual products, component images, quantities and packaging details. These four combos are product listings; the legacy Packages tool remains available for compatibility but should not duplicate them.
4. In **Page content**, select a page and edit structured fields/cards. Save without the publish checkbox to retain a draft; check it to replace the published version. Homepage previews use draft content. Page records control overall visibility. Supported page slugs are `home`, `privacy-policy` and `terms`; creating arbitrary page records does not create new routes.
5. In **Global settings**, configure company details, logo/favicon URLs, WhatsApp digits including country code, announcement, CTA, brand color, SEO and notification destination. WhatsApp buttons appear only when a number is configured.
6. In **Enquiries**, filter/search, update lead status, add internal notes, contact prospects and export CSV. CSV formulas are neutralized. WhatsApp conversations are not automatically stored as enquiries.

No imported customer logos, invented success metrics or fabricated testimonials are published. Testimonial/portfolio publishing requires explicit verification. Privacy and terms are editable drafts awaiting the business's approved text.

### Roles

| Role        | Access                                                                   |
| ----------- | ------------------------------------------------------------------------ |
| Super Admin | All sections, global settings and staff management                       |
| Editor      | Catalog, packages, CMS, navigation and media; no leads or staff settings |
| Sales       | Dashboard and enquiry management; no content mutation                    |

## Production deployment

This is a Node.js/PostgreSQL app, not a static export. Use a Node host behind HTTPS with a managed PostgreSQL database. The code has not been deployed to a public host.

1. Provision PostgreSQL and set a TLS-enabled `DATABASE_URL` through your host's secret manager. Keep backups and point-in-time recovery as appropriate.
2. Set `SITE_URL` to the exact HTTPS origin. API mutation origin checks depend on it. Set `TRUST_PROXY=true` only behind a proxy that **overwrites** `X-Forwarded-For`; otherwise requests share a conservative rate-limit bucket.
3. Set `MEDIA_DRIVER=s3` for serverless or multi-instance deployments. Configure `S3_BUCKET`, `S3_REGION`, optional `S3_ENDPOINT`, `S3_PUBLIC_URL` and AWS credentials. Provide a public/CDN read URL for approved image assets; keep write credentials server-side. The local driver requires a persistent `public/uploads` volume and is served through `/media/[key]` so newly uploaded files work without a rebuild.
4. Install and build with `npm ci`, `npm run db:generate`, `npm run db:migrate`, and `npm run build`. Run migrations as a release step, not on every request. Seed only when desired: reruns preserve existing records, but recreate missing reference entries.
5. Initialize a production administrator by setting `ADMIN_EMAIL` and a random `ADMIN_PASSWORD` of at least 14 characters, then running `npm run admin:create`. Remove the password from the environment afterward. Do not copy the local database or local admin account to production.
6. Run `npm start` behind a reverse proxy on the same host. It binds loopback by default. Container hosts that need an external bind can use `npx next start --hostname 0.0.0.0` within their managed network.
7. Set SMTP variables and a notification email in Global settings. Leads save even if email fails. The notification outbox records status; Sales/Super Admin can retry pending notifications from Enquiries. SMTP delivery is not verified without real credentials.
8. Configure either GA4 or GTM as appropriate; avoid duplicate tracking. Review the analytics configuration and consent requirements for your deployment. Forms emit `form_start`, `generate_lead` after confirmed save, `view_item`, `select_item` and `whatsapp_click` without personal contact details.
9. Review and publish policies, genuine business details, inventory, imagery and any claims before launch. Replace reference image URLs with approved durable assets as needed.

Add a reverse-proxy request-size limit (for example 10 MB for uploads and 64 KB for JSON routes), TLS and access logging that redacts cookies and request bodies. Schedule normal database/session/rate-limit maintenance. Media record deletion refuses assets referenced by catalog/CMS records; orphaned storage objects should be removed through your storage retention process.

## Validation

With the local dev server running:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

Integration tests use disposable local records and clean them up; do not point them at production. `TEST_URL` can select another loopback port. See `docs/VERIFICATION.md` for the actual checks and remaining deployment prerequisites.

## Source map

- `src/app/(public)` — public routes
- `src/app/admin` — protected admin pages and login
- `src/app/api` — validated server endpoints
- `src/components` — shared layout, forms, catalog and admin editors
- `src/lib` — database access, schemas, authorization and CMS operations
- `prisma` — normalized schema, SQL migration and idempotent seed
- `scripts` — local database and safe admin initialization
- `references` — untouched supplied HTML/screenshots and logo
- `tests` — validation and database/API integration coverage

### Current catalogue

Run `npm run test:catalog` with the local server running to verify all 18 pages and enquiry contexts, filters, images and old URL redirects. This disposable QA suite requires local SMTP to be disabled and cleans up only its own enquiry records.
