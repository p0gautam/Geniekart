# Geniekart enquiry integration

Verified on 29 October 2026. Organization: **All Good Fox**. Project: **Geniekart**, ref **qzpjthltxcxpfmjrejma**. The existing website and staff accounts remain in place.

## Implementation

- Supabase public tables: `enquiries`, `enquiry_activity`, `enquiry_rate_limits`, `enquiry_notifications`.
- Three applied SQL migrations in `supabase/migrations`: enquiry storage and transactional RPCs; idempotent legacy import; restriction of direct execution of the existing RLS DDL trigger function.
- Shared public handler: `POST /api/enquiries`. Homepage, Contact Us and quote popups use `src/components/enquiry.tsx`. Published combo names and contents are read from the catalogue on the server, not trusted from submitted text.
- Admin: `/admin/leads` (Enquiries), plus Overview counts/recent enquiries. `GET /api/admin/leads` provides database-filtered search, status, occasion, UTC date range, counts and 20-record pages; `?id=UUID` supplies details and activity. `POST /api/admin/leads` saves status and notes atomically with the current staff actor. CSV: `/api/admin/leads/export`.
- The existing admin session system requires an active `SUPER_ADMIN` or `SALES` account. `EDITOR` cannot access enquiries. Sessions use hashed opaque tokens, expiry, HttpOnly cookies and production Secure cookies. Mutations validate the configured site origin.
- RLS is enabled on all four tables. Anonymous and ordinary Supabase-authenticated roles have no read/write or RPC execute privileges. All database access goes through the authorized server using the secret API key. No new public Supabase sign-up flow exists.
- Admin list/detail automatically polls every **15 seconds**, also refreshes after reconnect, and has manual Refresh/Retry. Failed reads retain existing visible results with an error; failed writes retain the draft. The public form only confirms success after storage succeeds and retains fields on failure.
- Submission UUIDs prevent concurrent retry duplicates. Update operation UUIDs prevent duplicate notes/history. The shared database rate limit is 15 new enquiries/hour per trusted client IP; without trusted proxy configuration it deliberately uses one conservative shared bucket. Enable `TRUST_PROXY` only where the hosting proxy overwrites incoming forwarded headers.
- Email notification persistence is separate from enquiry persistence. SMTP is currently not configured; no test emails or WhatsApp messages were sent.

## Configuration (names only)

Server environment: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `DATABASE_URL`, `SITE_URL`, and optional `TRUST_PROXY`. Existing SMTP/media variables remain as documented in `.env.example`. Never prefix the secret key with `NEXT_PUBLIC_` or expose it through a browser client.

The key was found in `F:\Codex\Geniekart\.env` and authenticated successfully without displaying its value. The sibling path `F:\Codex\Geniekart.env` was not present.

Catalogue, CMS, staff accounts and sessions still use the existing Prisma database. This integration does not move those unrelated features into Supabase. One existing local enquiry was imported, preserving its original record, timestamps and history. The importer is idempotent and does not send notifications.

Important source files: `src/lib/supabase-enquiries.ts`, `src/lib/enquiry-types.ts`, `src/lib/validation.ts`, `src/lib/notifications.ts`, `src/components/enquiry.tsx`, `src/components/admin-leads.tsx`, enquiry/admin API routes, and the existing admin page routes. Helpers: `scripts/check-supabase.ts`, `scripts/import-legacy-enquiries.ts`, `scripts/verify-supabase-enquiries.ts`.

## Verification

- Production build, ESLint and type checking passed during implementation.
- Local HTTP integration passed: existing admin login; unauthorized list/export denial; valid save; concurrent identical submissions producing one record; missing consent/honeypot/origin rejection; authoritative combo snapshot; search/status/occasion filtering; page-two empty results with correct total; persisted status/note and staff actor; note/history retry deduplication; CSV export.
- Secret-value scan passed for `.next/static` and the homepage response.
- Eight isolated validation/failure tests passed, including missing configuration, network failure, database failure, invalid JSON, content type, request-size limits and invalid date range.
- Browser verification: existing dashboard and Enquiries detail display the persisted test enquiry, its Quoted status, note and actor history. The refresh timestamp advances without navigation. Mobile detail at 390 px had no document overflow; no browser console errors were recorded in that session.
- Database privilege inspection confirmed anonymous and ordinary authenticated roles cannot read/update these tables or execute the application RPCs. Security advisor returned no warnings, only four expected informational “RLS enabled no policy” notices: access is intentionally denied to those roles. See https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy.
- Synthetic enquiry retained: **d0a6da05-c8e9-4cbd-a160-928cbce03c90**. It is explicitly labelled as an integration test and uses an example.com email. Existing records were not deleted.

Run the isolated checks with `node --conditions=react-server --import tsx --test tests/supabase-errors.test.ts tests/validation.test.ts`. The opt-in HTTP verification script requires the running local site, existing local admin credential file and SMTP disabled; every run retains one labelled synthetic enquiry. The older `tests/integration.test.ts` still assumes Prisma enquiry storage and is not a valid verification of this Supabase integration; do not use its enquiry lifecycle assertions for acceptance.

## Production work still pending

No public deployment has been performed or verified. Local preview: http://localhost:3000/ ; admin: http://localhost:3000/admin/leads . These links require the local Node server and existing local PostgreSQL instance to remain running.

1. Select and authorize the Node hosting destination and HTTPS domain.
2. Provision a persistent production Prisma database for catalogue/CMS/admin accounts, migrate the existing approved content, configure durable media storage, and provision production staff credentials (do not deploy the local development account).
3. Add server-only environment variables in the host's secret manager, set the exact HTTPS `SITE_URL`, and configure trusted proxy handling for that host. Configure SMTP only if notifications are wanted.
4. Deploy the reviewed build and repeat submission, admin permission, polling and recovery checks through the live domain. Verify the same synthetic enquiry in Supabase and the live admin panel.

The completed local checks are not proof of live deployment. Full end-to-end browser outage simulation and a newly inserted record arriving through polling were not exercised; server failure behavior has isolated tests and polling was observed in the browser.
