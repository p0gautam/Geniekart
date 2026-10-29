/* eslint-disable @typescript-eslint/no-require-imports -- Node bootstrap runs before TypeScript tools. */
const fs = require('fs');
const { Client } = require('pg');
async function main() {
  const password = fs.readFileSync('.local/db-password', 'utf8');
  const client = new Client({
    host: '127.0.0.1',
    port: 54329,
    user: 'geniekart',
    password,
    database: 'postgres',
  });
  await client.connect();
  const r = await client.query("SELECT 1 FROM pg_database WHERE datname='geniekart'");
  if (!r.rowCount) await client.query('CREATE DATABASE geniekart');
  await client.end();
  if (!fs.existsSync('.env'))
    fs.writeFileSync(
      '.env',
      `DATABASE_URL="postgresql://geniekart:${password}@127.0.0.1:54329/geniekart"\nSITE_URL="http://localhost:3000"\nMEDIA_DRIVER="local"\n`,
    );
  console.log('Local database connected; .env ready.');
}
main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
