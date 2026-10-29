# Curated corporate gifting catalogue

The local site now publishes exactly **18 products: 14 individual listings and four predefined combos**, across eight categories. The previous 108 dummy products and four reference packages are archived, preserving their IDs and historical enquiry associations. They are excluded from the public catalogue and sitemap. There are 127 legacy redirects covering product, package and category URLs.

## Backup and repeatability

The pre-change snapshot is `.local/backups/catalog-1792726809704.json`. It contains all 108 original products, image/attribute/collection relations, four packages and their components, categories, collections, media metadata and existing redirects. Original image files remain in place. Keep this snapshot and `public/uploads` with database backups; the JSON snapshot is not a full PostgreSQL disaster-recovery backup and contains no enquiry/contact records.

The additive migration `202610230001_catalog_combos` preserves existing schema fields and adds product type, variants, enquiry preferences, enquiry enablement, combo contents and packaging details. Packaging-only components are embedded records, never extra top-level products. Matching components reference one of the 14 individual product IDs.

For a fresh database, run the migrations and site seed, then `npm run catalog:backup`. Pass the returned path to `npm run catalog:replace -- <backup-file>`. Replacement is an explicit maintenance operation: it restores the curated definitions, so back up before running it again. It refuses unrecognised product SKUs and applies catalogue changes in a transaction. Legacy dummy-population commands have been removed. Ordinary admin edits do not require rerunning replacement.

## Files changed

- `prisma/schema.prisma`, additive migration and `prisma/seed.ts`: combo support and removal of dummy seeding.
- `scripts/catalog-data.ts`, `backup-catalog.ts`, `replace-catalog.ts`: one source for the 18 requested definitions, backup and transactional catalogue replacement.
- `src/components/combo-contents.tsx`, product details, gallery/actions, product cards and homepage: reusable combo contents, component galleries and Get Quote actions using existing layouts.
- `src/components/enquiry.tsx`, `src/app/api/enquiries/route.ts`: customisation and packaging fields; authoritative server-side snapshots of combo contents saved with the existing enquiry record and notification outbox.
- `src/lib/validation.ts`, `combo.ts`, `admin.ts`, `editor-config.ts`, admin editor: validation and editable combo definitions. Linked components must be published individual products.
- Catalog, shared footer and CSS: category redirects, current welcome-kit link, wrapping galleries and component-list spacing.
- `tests/catalog.test.ts`, package scripts and README: verification and maintenance instructions.

## Verification

- All 18 detail pages and all 18 enquiry submissions passed; selected names, quantities, preferences, combo contents and notification records were verified in PostgreSQL. Disposable test enquiries were removed.
- All eight category filters, search, pagination, the Diwali collection and 18 product sitemap entries passed.
- All 31 new local WebP placeholders and all 127 legacy redirects passed HTTP checks.
- Existing seven validation/integration tests passed, including admin roles, media uploads, CMS publishing, idempotency, slug changes and enquiry lifecycle.
- Production build, TypeScript and lint passed.
- Mobile hamper and catalogue checks at 390px viewport and a tablet detail-page check at 768px found no horizontal overflow. A real browser form submission retained quantity 40, hamper contents and packaging preferences and displayed success; its disposable record was verified and removed.

## Assets and integrations

All new imagery is clearly labeled **temporary placeholder**, including complete-box, closed-box, open-box, branding-detail and component gallery slots. No supplier images, invented prices, minimum quantities, inventory or delivery promises were added. Approved licensed product photography and supplier specifications are still required.

The existing database enquiry and notification-outbox integration remains active. SMTP is not configured locally, so outbound email delivery was not tested and notifications remain pending until SMTP and the recipient are configured. No production deployment was performed.
