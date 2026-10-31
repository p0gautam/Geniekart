# Production database repair — 31 October 2026

Hostinger commit `6189f56` built successfully but failed at runtime because `public.Product` and `public.SiteSettings` did not exist. The configured database was reachable; its Prisma application schema had not been initialized.

Applied the two existing Prisma SQL migrations to Supabase project `qzpjthltxcxpfmjrejma` through the management connection. Enabled RLS and revoked public/anon/authenticated access on all 26 application tables. Recorded both migration names and exact SHA-256 checksums in `_prisma_migrations` after successful execution. Existing lowercase enquiry tables and all three enquiries were preserved.

Imported the local catalogue and CMS content using insert-only operations: 139 product records (including 17 published combos), four pages, 63 sections, six FAQs, settings, navigation, categories, collections, media metadata and relationships. Existing production records are never overwritten by the export's `ON CONFLICT DO NOTHING` statements. Created the explicitly requested production administrator using a freshly generated bcrypt hash; no old sessions or unrelated staff accounts were copied.

`scripts/prepare-production-content.ts` prepares the private export under ignored `.local/production-content/`. It does not execute the export. Files include a password hash and must never be committed or published. Do not run this export against an unrelated project. Always inspect and back up the destination before importing; run statements in manifest order because of foreign keys.

Verified the Hostinger preview returns HTTP 200 and contains corporate-gifting content rather than the application error. Verified production login and authorized enquiry access return HTTP 200, then signed out the test session. These API tests used the configured production Origin `https://geniekart.in`. Browser form submissions on the temporary hostingersite.com domain will fail origin checks until SITE_URL is temporarily set to that preview origin or the real domain is connected. Keep the exact production SITE_URL when connecting geniekart.in.

Confirmed every public table has RLS, with no anonymous or ordinary authenticated read grants. Security advisor reported no warnings/errors; informational no-policy notices are expected for server-only tables.

Published combos use repository assets. Older media-library records include 92 local upload URLs whose files were not transferred to Hostinger. Those are not the published combo images; transfer the legacy files to durable storage before reusing those media records. Future uploads still require a durable storage plan.

The domain still requires connection in Hostinger. Environment variable `ADMIN_PASSWORD` can be removed from the host after initialization; login verifies the stored database hash, not that variable. No credentials or export payloads belong in GitHub.
