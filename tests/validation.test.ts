import test from 'node:test';
import assert from 'node:assert/strict';
import {
  leadSchema,
  productSchema,
  settingsSchema,
  csvCell,
  sectionContentSchema,
} from '../src/lib/validation';
const lead = {
  requestId: crypto.randomUUID(),
  name: 'Test Contact',
  company: 'Test Company',
  email: 'test@example.test',
  phone: '+919876543210',
  quantity: 50,
  consent: true,
  source: '/products/test',
  utm: { utm_campaign: 'festive' },
};
test('enquiries require positive integer quantity and consent', () => {
  assert.equal(leadSchema.safeParse(lead).success, true);
  assert.equal(leadSchema.safeParse({ ...lead, quantity: 0 }).success, false);
  assert.equal(leadSchema.safeParse({ ...lead, quantity: 1.2 }).success, false);
  assert.equal(leadSchema.safeParse({ ...lead, consent: false }).success, false);
});
test('spam and unsupported attribution are rejected', () => {
  assert.equal(leadSchema.safeParse({ ...lead, website: 'bot' }).success, false);
  assert.equal(leadSchema.safeParse({ ...lead, utm: { email: 'private' } }).success, false);
});
test('products reject invalid slugs, negative prices and quantities', () => {
  const p = { name: 'Test Gift', sku: 'TEST', slug: 'test-gift', description: 'Test' };
  assert.equal(productSchema.safeParse(p).success, true);
  for (const bad of [{ slug: '../test' }, { price: -1 }, { minimumOrder: 0 }])
    assert.equal(productSchema.safeParse({ ...p, ...bad }).success, false);
});
test('CSV neutralizes spreadsheet formulas and escapes quotes', () => {
  assert.equal(csvCell('=HYPERLINK("bad")'), '"\'=HYPERLINK(""bad"")"');
  assert.equal(csvCell('hello, world'), '"hello, world"');
});
test('CMS rejects executable URLs', () => {
  assert.equal(
    sectionContentSchema.safeParse({ title: 'Title', imageUrl: 'javascript:alert(1)' }).success,
    false,
  );
  assert.equal(
    sectionContentSchema.safeParse({ title: 'Title', imageUrl: '//evil.test' }).success,
    false,
  );
  assert.equal(
    sectionContentSchema.safeParse({ title: 'Title', imageUrl: '/uploads/test.webp' }).success,
    true,
  );
});
test('settings enforce WhatsApp digits and analytics IDs', () => {
  assert.equal(settingsSchema.shape.whatsapp.safeParse('919876543210').success, true);
  assert.equal(settingsSchema.shape.whatsapp.safeParse('javascript:evil').success, false);
  assert.equal(settingsSchema.shape.gaId.safeParse('G-TEST123').success, true);
});
