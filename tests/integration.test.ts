import test from 'node:test';
import assert from 'node:assert/strict';
import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
loadEnvConfig(process.cwd());
const base = process.env.TEST_URL || 'http://localhost:3000';
test('database-backed catalog, admin authorization, uploads, packages and enquiry lifecycle', async () => {
  assert.match(
    base,
    /^http:\/\/(localhost|127\.0\.0\.1):/,
    'Integration tests run only against local preview',
  );
  const db = new PrismaClient();
  const prefix = 'test-' + randomUUID();
  const userIds: string[] = [];
  let productId = '';
  let packageId = '';
  let mediaId = '';
  let categoryId = '';
  let pageId = '';
  const requests: string[] = [];
  async function call(path: string, data?: unknown, cookie?: string, origin = base) {
    return fetch(base + path, {
      method: data === undefined ? 'GET' : 'POST',
      headers: {
        ...(data !== undefined ? { 'Content-Type': 'application/json', Origin: origin } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: data === undefined ? undefined : JSON.stringify(data),
      redirect: 'manual',
    });
  }
  async function login(role: 'SUPER_ADMIN' | 'EDITOR' | 'SALES') {
    const password = randomUUID() + randomUUID();
    const email = prefix + '-' + role.toLowerCase() + '@example.test';
    const user = await db.adminUser.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(password, 12),
        name: 'Integration Test',
        role,
      },
    });
    userIds.push(user.id);
    const r = await call('/api/auth/login', { email, password });
    assert.equal(r.status, 200, await r.text());
    return r.headers.get('set-cookie')!.split(';')[0];
  }
  try {
    assert.equal((await call('/api/admin/products')).status, 401);
    assert.equal((await call('/api/admin/leads/export')).status, 401);
    assert.equal((await call('/admin')).status, 307);
    const admin = await login('SUPER_ADMIN'),
      editor = await login('EDITOR'),
      sales = await login('SALES');
    for (const route of [
      '/admin',
      '/admin/products',
      '/admin/packages',
      '/admin/sections',
      '/admin/media',
      '/admin/leads',
      '/admin/settings',
      '/admin/users',
    ]) {
      assert.equal(
        (await call(route, undefined, admin)).status,
        200,
        `Admin route ${route} renders`,
      );
    }
    assert.equal((await call('/api/admin/leads', undefined, editor)).status, 403);
    assert.equal((await call('/api/admin/products', {}, sales)).status, 403);
    assert.equal((await call('/api/admin/settings', {}, editor)).status, 403);
    assert.equal(
      (await call('/api/admin/products', {}, admin, 'https://untrusted.example')).status,
      403,
    );
    let r = await call(
      '/api/admin/categories',
      { data: { name: 'Integration category', slug: prefix, status: 'PUBLISHED', position: 99 } },
      admin,
    );
    assert.equal(r.status, 200, await r.clone().text());
    categoryId = (await r.json()).id;
    const bytes = await sharp({
      create: { width: 20, height: 20, channels: 3, background: '#b92b27' },
    })
      .png()
      .toBuffer();
    const form = new FormData();
    form.set('file', new Blob([new Uint8Array(bytes)], { type: 'image/png' }), 'test.png');
    form.set('alt', 'Integration upload');
    r = await fetch(base + '/api/admin/media/upload', {
      method: 'POST',
      headers: { Origin: base, Cookie: editor },
      body: form,
    });
    assert.equal(r.status, 200, await r.clone().text());
    const media = await r.json();
    mediaId = media.id;
    assert.equal((await fetch(base + media.url)).status, 200);
    const product = {
      name: 'Integration Gift ' + prefix,
      slug: prefix,
      sku: prefix,
      description: 'A test gift',
      productType: 'combo',
      includedProducts: [
        {
          displayName: 'Test diary',
          quantity: 1,
          image: '',
          description: 'Disposable test component',
        },
        {
          displayName: 'Test pen',
          quantity: 1,
          image: '',
          description: 'Disposable test component',
        },
      ],
      shortDescription: 'Test description',
      categoryId,
      mediaIds: [mediaId],
      status: 'PUBLISHED',
      minimumOrder: 10,
      attributes: [{ label: 'Material', value: 'Paper' }],
    };
    r = await call('/api/admin/products', { data: product }, editor);
    assert.equal(r.status, 200, await r.clone().text());
    productId = (await r.json()).id;
    assert.equal((await call('/products/' + prefix)).status, 308);
    assert.match(
      await (await call('/corporate-gifts?q=' + encodeURIComponent(prefix))).text(),
      new RegExp(prefix),
    );
    assert.equal(
      (await call('/api/admin/media/manage', { id: mediaId, action: 'delete' }, editor)).status,
      400,
    );
    r = await call(
      '/api/admin/packages',
      {
        data: {
          name: 'Integration Package',
          slug: prefix,
          description: 'A test package',
          status: 'PUBLISHED',
          items: [{ productId, quantity: 2 }],
          mediaIds: [mediaId],
        },
      },
      editor,
    );
    assert.equal(r.status, 200, await r.clone().text());
    packageId = (await r.json()).id;
    assert.equal((await call('/packages/' + prefix)).status, 308);
    const requestId = randomUUID();
    requests.push(requestId);
    const lead = {
      requestId,
      name: 'Test Contact',
      company: 'Integration Company',
      email: 'integration@example.test',
      phone: '+919876543210',
      quantity: 50,
      consent: true,
      source: '/products/' + prefix,
      utm: { utm_source: 'integration' },
      productId,
      message: 'Disposable automated test',
    };
    r = await call('/api/enquiries', lead);
    assert.equal(r.status, 201, await r.text());
    assert.equal((await call('/api/enquiries', lead)).status, 200);
    assert.equal(await db.enquiry.count({ where: { requestId } }), 1);
    const saved = await db.enquiry.findUniqueOrThrow({
      where: { requestId },
      include: { items: true },
    });
    assert.equal(saved.items[0].productId, productId);
    assert.equal(saved.items[0].nameSnapshot, product.name);
    assert.equal(
      (await call('/api/enquiries', { ...lead, requestId: randomUUID(), quantity: 0 })).status,
      422,
    );
    assert.equal(
      (
        await call(
          '/api/admin/leads',
          { id: saved.id, data: { status: 'QUALIFIED', note: 'Test qualification' } },
          sales,
        )
      ).status,
      200,
    );
    assert.equal(await db.leadNote.count({ where: { enquiryId: saved.id } }), 1);
    r = await call(
      '/api/admin/products',
      { id: productId, data: { ...product, name: 'Changed Name', slug: prefix + '-new' } },
      editor,
    );
    assert.equal(r.status, 200);
    assert.equal((await call('/products/' + prefix)).status, 308);
    assert.equal(
      (await db.enquiryItem.findFirstOrThrow({ where: { enquiryId: saved.id } })).nameSnapshot,
      product.name,
    );
    assert.equal((await call('/api/admin/leads/export', undefined, sales)).status, 200);
    r = await call(
      '/api/admin/products',
      { id: productId, data: { ...product, status: 'ARCHIVED' } },
      editor,
    );
    assert.equal(r.status, 200);
    assert.equal((await call('/products/' + prefix)).status, 308);
    const packageRequest = randomUUID();
    requests.push(packageRequest);
    assert.equal(
      (
        await call('/api/enquiries', {
          ...lead,
          productId: undefined,
          packageId,
          requestId: packageRequest,
        })
      ).status,
      201,
    );
    r = await call(
      '/api/admin/pages',
      { data: { slug: prefix, title: 'CMS test page', status: 'DRAFT' } },
      editor,
    );
    assert.equal(r.status, 200);
    pageId = (await r.json()).id;
    const sectionData = {
      pageId,
      kind: 'text',
      position: 0,
      draft: { title: 'Published heading', description: 'Published body' },
      publish: true,
    };
    r = await call('/api/admin/sections', { data: sectionData }, editor);
    assert.equal(r.status, 200);
    const sectionId = (await r.json()).id;
    r = await call(
      '/api/admin/sections',
      {
        id: sectionId,
        data: { ...sectionData, draft: { title: 'Draft heading' }, publish: false },
      },
      editor,
    );
    assert.equal(r.status, 200);
    const section = await db.section.findUniqueOrThrow({ where: { id: sectionId } });
    assert.equal((section.draft as { title: string }).title, 'Draft heading');
    assert.equal((section.published as { title: string }).title, 'Published heading');
    assert.equal((await call('/corporate-diwali-gifts?preview=1', undefined, editor)).status, 200);
    const draftProduct = await db.product.findFirst({ where: { status: 'DRAFT' } });
    if (draftProduct) {
      assert.equal((await call('/products/' + draftProduct.slug)).status, 404);
      assert.equal(
        (await call('/products/' + draftProduct.slug + '?preview=1', undefined, editor)).status,
        200,
      );
    }
    await call('/api/auth/logout', {}, admin);
    assert.equal((await call('/api/admin/products', undefined, admin)).status, 401);
  } finally {
    await db.enquiry.deleteMany({ where: { requestId: { in: requests } } });
    if (packageId) await db.giftPackage.delete({ where: { id: packageId } });
    if (productId) await db.product.delete({ where: { id: productId } });
    await db.redirect.deleteMany({ where: { from: { startsWith: '/products/' + prefix } } });
    if (categoryId) await db.category.delete({ where: { id: categoryId } });
    if (pageId) await db.page.delete({ where: { id: pageId } });
    if (mediaId) await db.mediaAsset.delete({ where: { id: mediaId } });
    await db.auditLog.deleteMany({ where: { userId: { in: userIds } } });
    await db.adminUser.deleteMany({ where: { id: { in: userIds } } });
    await db.$disconnect();
  }
});
