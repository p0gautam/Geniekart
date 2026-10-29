import test from 'node:test';
import assert from 'node:assert/strict';
import { supabaseRequest, readEnquiryJson, enquiryFilters } from '../src/lib/supabase-enquiries';

test('storage failures remain retryable and never become success', async () => {
  const originalFetch = global.fetch;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  try {
    delete process.env.SUPABASE_SECRET_KEY;
    await assert.rejects(supabaseRequest('rpc/geniekart_list'), {
      status: 503,
      category: 'configuration',
    });
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SECRET_KEY = 'sb_secret_synthetic';
    global.fetch = async () => {
      throw new Error('synthetic network failure');
    };
    await assert.rejects(supabaseRequest('rpc/geniekart_list'), {
      status: 503,
      category: 'storage_unavailable',
    });
    global.fetch = async () => new Response('synthetic database failure', { status: 500 });
    await assert.rejects(supabaseRequest('rpc/geniekart_list'), {
      status: 503,
      category: 'storage_unavailable',
    });
  } finally {
    global.fetch = originalFetch;
    if (url === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = url;
    if (key === undefined) delete process.env.SUPABASE_SECRET_KEY;
    else process.env.SUPABASE_SECRET_KEY = key;
  }
});
test('bounded JSON and date filters reject malformed requests', async () => {
  const request = (body: string, type = 'application/json') =>
    new Request('https://example.com', { method: 'POST', headers: { 'Content-Type': type }, body });
  await assert.rejects(readEnquiryJson(request('{}', 'text/plain')), { status: 415 });
  await assert.rejects(readEnquiryJson(request('{')), { status: 400 });
  await assert.rejects(readEnquiryJson(request(' '.repeat(32769))), { status: 413 });
  assert.equal(enquiryFilters.safeParse({ from: '2026-10-29', to: '2026-10-01' }).success, false);
});
