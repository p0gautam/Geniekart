# Combo catalogue update — 28 October 2026

## Delivery

Local preview: http://localhost:3000/corporate-gifts

Nine reference-derived gift sets were generated individually with the built-in imagegen tool and visually inspected before the next generation. The eight existing complete combos remain published. Fourteen individual component records remain intact but are excluded from public cards, filters, search and enquiries. Total visible catalogue: 17 combos.

High-resolution PNG masters: `assets/masters/` (1254 × 1254 pixels each).
Responsive WebP derivatives: `public/images/combos/` (480, 768 and 1024 pixels, 27 files).
Exact prompts and original generated-file provenance: `scripts/reference-assets.json`.
Repeatable asset/database integration: `scripts/publish-reference-combos.ts`.
Database backup before changes: `.local/backups/combo-only-*.json`.
No original supplier poster, price sheet or WhatsApp photograph is served on the website.

## All 13 source references

Source directory: `C:/Users/DESKTOP/Downloads/`. All files were reviewed individually before generation.

| # | Exact source filename | Result / treatment |
|---|---|---|
| 1 | WhatsApp Image 2026-10-25 at 17.12.38 (1).jpeg | Three sets separated. Executive repeats #2; celebration repeats #5. Unique middle set becomes **Cork & Glass Executive Set** (`cork-and-glass-executive-set`): brown briefcase, jute-sleeved glass bottle, cork-style diary, two glass cups, digital clock. |
| 2 | WhatsApp Image 2026-10-25 at 17.12.38.jpeg | **Executive Signature Set** (`executive-signature-set`): briefcase, bottle, diary, boxed pen, clock, card holder. Demonstration phone excluded. |
| 3 | WhatsApp Image 2026-10-25 at 17.12.37 (2).jpeg | **Tan Pocket Diary Gift Set** (`tan-pocket-diary-gift-set`): pocket diary, one metal pen, jute-sleeved glass bottle. Phone and repeated inset pen excluded. |
| 4 | WhatsApp Image 2026-10-25 at 17.12.37 (1).jpeg | **Black Business Essentials Set** (`black-business-essentials-set`): card holder, pen, keychain, temperature-style bottle. Black main composition only; white/red variants are not separate listings or availability promises. |
| 5 | WhatsApp Image 2026-10-25 at 17.12.37.jpeg | **Cork Celebration Gift Set** (`cork-celebration-gift-set`): briefcase, cork-style diary, cork-base bottle, lidded mug, boxed pen. Five merchandise items; unsupported “6 in 1” headline discarded. Deduplicated against #1. |
| 6 | WhatsApp Image 2026-10-25 at 17.12.36.jpeg | **Blue Bamboo & Jute Gift Set** (`blue-bamboo-jute-gift-set`): diary, jute-sleeved glass bottle, pen, empty phone stand, keychain, card holder. |
| 7 | WhatsApp Image 2026-10-25 at 17.12.35 (2).jpeg | **Tan Diary & Bottle Gift Set** (`tan-diary-bottle-gift-set`): clasp diary, black rope-loop bottle, matching pen. |
| 8 | WhatsApp Image 2026-10-25 at 17.12.35 (1).jpeg | **Blush Business Gift Set** (`blush-business-gift-set`): diary, bottle, pen, keychain. Hand and surrounding clutter excluded. |
| 9 | WhatsApp Image 2026-10-25 at 17.12.35.jpeg | Household/lunchware reference only. No confirmed single bundle; no generated listing or Geniekart manufacturer relabelling. |
| 10 | WhatsApp Image 2026-10-25 at 17.12.34.jpeg | **Blue Bamboo & Black Bottle Set** (`blue-bamboo-black-bottle-set`): diary, black wooden-cap bottle, pen, empty stand, keychain, card holder. Bottle distinction from #6 preserved. |
| 11 | WhatsApp Image 2026-10-23 at 21.05.11.jpeg | Bottle appearance reference only. No standalone listing, prices or capacity claims copied. |
| 12 | WhatsApp Image 2026-10-23 at 21.04.53 (1).jpeg | Pen appearance reference only. No standalone listing or prices copied. |
| 13 | WhatsApp Image 2026-10-23 at 21.04.53.jpeg | Diary appearance reference only. Supplier details, prices and availability claims excluded. |

Every new image has the same filename stem as its combo slug. Geniekart personalization replaces supplier/sample marks. Generated photography is illustrative; the visible catalogue note makes final appearance/branding subject to quotation. Drinks in the glass-cup photograph are styling only, not included merchandise. No sustainability certification or manufacturing claim is made.

## Website changes

- Header: Home, accessible Gifting disclosure, Why GenieKart, Contact Us; Enquire Now retained. Mobile submenu expands. Escape closes and restores trigger focus; links remain normal links.
- Homepage: original hero, copy and adjacent form retained; shortcut strip removed; five occasion links; only complete combo cards and Featured Gift Combos. Remaining section order retained; portfolio placeholder replaced by the new celebration illustration.
- Corporate Gifts, Diwali Gifts and four `/gifting/[slug]` pages: shared database products, multiple occasion memberships without duplicate product records, search, occasion filter, stable sorting, bounded pagination.
- Cards: image/title/main area and separate filled Get Quote button open the same modal. No product-detail navigation. Existing product/package/category URLs redirect; sitemap omits retired detail routes.
- Homepage/contact/modal reuse `EnquiryForm`. Modal shows a compact selected-combo summary; no extra customisation/packaging fields. Submission includes ID, name, collection context and source URL. Backend uses authoritative product name, persists included contents, and retains idempotency. Error values are preserved; success requires backend confirmation.
- Modal uses native dialog focus containment, Escape, a visible close button, internal scrolling and focus restoration. Phone-size cards use one column; product images use contain with reserved square space.

## Verification

Build and TypeScript: passed. ESLint: passed. Existing validation/admin/enquiry regression suite: 7 passed. Combo catalogue integration test: passed (all five collections, search, sorting, both pages, out-of-range page clamping, redirect handling, retained components, all 27 image URLs, no detail links, local enquiry contexts and duplicate submission handling).

Local test enquiries use example.test addresses with SMTP disabled; exact test records are cleaned up. No real leads or external messages were sent.

Browser QA covers desktop 1440, tablet 768 and phones 390/360; results and screenshots are recorded alongside this document after final visual checks.

## Content decisions

The household/lunchware sheet remains reference-only because it does not define a confirmed hamper. Final materials, dimensions, availability, branding and packaging remain quotation-stage confirmations. All nine reference compositions are accounted for; there are no blocked asset-generation tasks.

Final browser verification completed 29 October 2026: homepage and catalogue inspected at 1440, 768, 390 and 360 pixels; no horizontal overflow observed. Native dialog scrolling, keyboard containment, Escape dismissal, focus restoration, mobile submenu, selected-combo summary and field validation were checked. Contact form retained entered name after validation failure and displayed human-readable errors. No browser console errors were observed in final contact/home/catalogue checks. Screenshot: `docs/combo-catalogue-preview.png`.
