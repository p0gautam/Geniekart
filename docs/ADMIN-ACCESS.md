# Updating admin credentials

Admin accounts are stored in the Prisma database selected by `DATABASE_URL`. Pushing code to GitHub does not change accounts in a deployed database.

To change an existing account, securely set `ADMIN_CURRENT_EMAIL`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the environment and run `npx tsx scripts/update-admin.ts` from the project directory. The script requires an existing account, preserves its role and active state, hashes the password with bcrypt, and revokes its previous sessions in one transaction. Password spaces are preserved. Passwords must be at least 14 characters and at most 72 UTF-8 bytes.

Use the intended production database connection when updating a live account. Remove the temporary admin environment variables after the command completes. Do not commit passwords, password hashes, environment files, database dumps or local access files to GitHub. The sign-in page is `/admin/login` on the site's own domain.
