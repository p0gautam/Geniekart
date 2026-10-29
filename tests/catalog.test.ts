import test from 'node:test';
import assert from 'node:assert/strict';
import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { access } from 'node:fs/promises';
import { occasions } from '../src/lib/occasions';
import assets from '../scripts/reference-assets.json';
loadEnvConfig(process.cwd());
const base = 'http://localhost:3000';
test('combo-only catalogue, occasion filtering, assets, redirects and enquiry context', async () => {
  const db = new PrismaClient();
  const ids: string[] = [];
  try {
    assert.ok(!process.env.SMTP_HOST, 'Only run submissions with outbound SMTP disabled');
    const combos = await db.product.findMany({
      where: { status: 'PUBLISHED', productType: 'combo', enquiryEnabled: true },
      include: {
        images: { include: { media: true } },
        collections: { include: { collection: true } },
      },
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
    });
    assert.equal(combos.length, 17);
    assert.equal(
      await db.product.count({ where: { status: 'PUBLISHED', productType: 'individual' } }),
      14,
    );
    const get = async (path: string) => (await fetch(base + path)).text();
    const html = await get('/corporate-gifts');
    assert.match(html, /17<!-- --> gift combos|17 gift combos/);
    assert.equal((html.match(/class="product-card"/g) || []).length, 12);
    assert.doesNotMatch(html, /href="\/(products|packages)\//);
    const second = await get('/corporate-gifts?page=2');
    assert.equal((second.match(/class="product-card"/g) || []).length, 5);
    const last = await get('/corporate-gifts?page=99999');
    assert.match(last, /Page <!-- -->2/);
    for (const o of occasions) {
      const count = combos.filter((p) =>
        p.collections.some((c) => c.collection.slug === o.slug),
      ).length;
      assert.ok(count > 0);
      const page = await get(o.href);
      assert.ok(
        page.includes(`${count}<!-- --> gift combos`) || page.includes(`${count} gift combos`),
      );
      assert.doesNotMatch(page, /href="\/(products|packages)\//);
    }
    const search = await get('/corporate-gifts?q=Blue%20Bamboo');
    assert.equal((search.match(/class="product-card"/g) || []).length, 2);
    const sorted = await get('/corporate-gifts?sort=name');
    const names = [...combos].sort((a, b) => a.name.localeCompare(b.name));
    assert.ok(
      sorted.indexOf('Enquire about ' + names[0].name.replaceAll('&', '&amp;')) <
        sorted.indexOf('Enquire about ' + names[1].name.replaceAll('&', '&amp;')),
    );
    for (const path of ['/', '/contact']) {
      const page = await get(path);
      assert.match(page, /Contact Person Name/);
      assert.doesNotMatch(
        page,
        /Customisation Requirements|Packaging Preferences|href="\/(products|packages)\//,
      );
    }
    assert.doesNotMatch(await get('/'), /quick-nav container|Featured corporate gifts/);
    assert.doesNotMatch(await get('/sitemap.xml'), /\/(products|packages|categories)\//);
    for (const p of combos)
      assert.equal((await fetch(base + '/products/' + p.slug, { redirect: 'manual' })).status, 308);
    assert.equal(
      (
        await fetch(base + '/products/vacuum-insulated-stainless-steel-bottle', {
          redirect: 'manual',
        })
      ).status,
      308,
    );
    for (const a of assets) {
      await access(`assets/masters/${a.slug}.png`);
      for (const w of [480, 768, 1024]) {
        const r = await fetch(`${base}/images/combos/${a.slug}-${w}.webp`);
        assert.equal(r.status, 200);
        assert.match(r.headers.get('content-type') || '', /image\/webp/);
      }
    }
    for (const [i, source] of ['/', '/contact', '/gifting/onboarding-kits'].entries()) {
      const requestId = randomUUID();
      ids.push(requestId);
      const p = combos[i];
      const data = {
        requestId,
        name: 'Disposable QA',
        company: 'Local Test',
        email: 'combo-qa@example.test',
        phone: '+919876543210',
        quantity: 25,
        consent: true,
        source,
        utm: {},
        ...(i === 2
          ? {
              productId: p.id,
              comboName: 'Untrusted submitted name',
              selectedOccasion: 'Onboarding Kits',
            }
          : {}),
      };
      const submit = () =>
        fetch(base + '/api/enquiries', {
          method: 'POST',
          headers: { Origin: base, 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      assert.equal((await submit()).status, 201);
      assert.equal((await submit()).status, 200);
      const saved = await db.enquiry.findUniqueOrThrow({
        where: { requestId },
        include: { items: true },
      });
      assert.equal(saved.source, source);
      if (i === 2) {
        assert.equal(saved.items[0].nameSnapshot, p.name);
        assert.match(saved.message || '', /Collection context: Onboarding Kits/);
        assert.ok(!(saved.message || '').includes('Untrusted submitted name'));
      }
    }
  } finally {
    await db.enquiry.deleteMany({ where: { requestId: { in: ids } } });
    await db.$disconnect();
  }
});
