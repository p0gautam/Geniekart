import { loadEnvConfig } from '@next/env';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
loadEnvConfig(process.cwd());
const base = 'http://localhost:3000';
const db = new PrismaClient();
async function call(path: string, data?: unknown, cookie = '', origin = base) {
  return fetch(base + path, {
    method: data === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin, Cookie: cookie },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
}
async function main() {
  assert.ok(!process.env.SMTP_HOST, 'Disable external notifications before synthetic testing.');
  assert.equal((await call('/api/admin/leads')).status, 401);
  assert.equal((await call('/api/admin/leads/export')).status, 401);
  const credentials = readFileSync('.local/admin-access.txt', 'utf8');
  const login = await call('/api/auth/login', {
    email: credentials.match(/^Email: (.+)$/m)![1].trim(),
    password: credentials.match(/^Password: (.+)$/m)![1].trim(),
  });
  assert.equal(login.status, 200, 'Existing local admin login');
  const cookie = login.headers.get('set-cookie')!.split(';')[0];
  const product = await db.product.findFirstOrThrow({
    where: { status: 'PUBLISHED', productType: 'combo', enquiryEnabled: true },
  });
  const requestId = randomUUID();
  const email = `integration-${requestId}@example.com`;
  const data = {
    requestId,
    name: 'Integration Test — synthetic',
    company: 'Geniekart integration verification',
    email,
    phone: '+12025550123',
    quantity: 25,
    consent: true,
    source: '/corporate-gifts',
    utm: {},
    occasion: 'Integration verification',
    productId: product.id,
    comboName: 'Untrusted name must be ignored',
    message: 'SYNTHETIC TEST RECORD. No customer contact required.',
  };
  assert.equal((await call('/api/enquiries', { ...data, consent: false })).status, 422);
  assert.equal((await call('/api/enquiries', { ...data, website: 'spam' })).status, 422);
  assert.equal((await call('/api/enquiries', data, '', 'https://example.com')).status, 403);
  const submissions = await Promise.all([
    call('/api/enquiries', data),
    call('/api/enquiries', data),
  ]);
  assert.deepEqual(submissions.map((r) => r.status).sort(), [200, 201]);
  const result = await (
    await call('/api/admin/leads?search=' + encodeURIComponent(email), undefined, cookie)
  ).json();
  assert.equal(result.total, 1);
  const id = result.rows[0].id;
  console.log('Synthetic enquiry ID:', id);
  assert.equal(result.rows[0].selected_combo_name, product.name);
  assert.equal(result.rows[0].status, 'New');
  const update = {
    id,
    operationId: randomUUID(),
    data: { status: 'Quoted', note: 'Synthetic verification note: persisted once.' },
  };
  assert.equal((await call('/api/admin/leads', update, cookie)).status, 200);
  assert.equal((await call('/api/admin/leads', update, cookie)).status, 200);
  const detail = await (await call('/api/admin/leads?id=' + id, undefined, cookie)).json();
  assert.equal(detail.status, 'Quoted');
  assert.equal(detail.activity.filter((a: { kind: string }) => a.kind === 'note_added').length, 1);
  assert.equal(
    detail.activity.filter((a: { kind: string }) => a.kind === 'status_changed').length,
    1,
  );
  assert.ok(
    detail.activity.find(
      (a: { kind: string; actor_id: string }) => a.kind === 'note_added' && a.actor_id,
    ),
  );
  const filtered = await (
    await call(
      '/api/admin/leads?search=' +
        encodeURIComponent(email) +
        '&status=Quoted&occasion=Integration%20verification',
      undefined,
      cookie,
    )
  ).json();
  assert.equal(filtered.total, 1);
  assert.equal(filtered.counts.Quoted, 1);
  const second = await (
    await call(
      '/api/admin/leads?search=' + encodeURIComponent(email) + '&page=2',
      undefined,
      cookie,
    )
  ).json();
  assert.equal(second.total, 1);
  assert.equal(second.rows.length, 0);
  const csv = await call('/api/admin/leads/export', undefined, cookie);
  assert.equal(csv.status, 200);
  assert.ok((await csv.text()).includes(email));
  const key = process.env.SUPABASE_SECRET_KEY!;
  function scan(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) scan(path);
      else
        assert.ok(!readFileSync(path).includes(Buffer.from(key)), 'Secret found in browser assets');
    }
  }
  scan('.next/static');
  assert.ok(!(await (await fetch(base)).text()).includes(key));
  await call('/api/auth/logout', {}, cookie);
  console.log(
    'PASS: submission, concurrent retry, validation, origin, admin login, filters, pagination, status, note deduplication, actor history, CSV, browser-secret scan. Test record retained.',
  );
}
main()
  .catch((error) => {
    console.error(
      'Verification failed:',
      error instanceof assert.AssertionError ? error.message : error.constructor.name,
    );
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
