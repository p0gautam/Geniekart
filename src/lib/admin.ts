import { db } from './db';
import { Prisma } from '@prisma/client';
import * as v from './validation';
export const editorResources = [
  'products',
  'packages',
  'categories',
  'collections',
  'pages',
  'sections',
  'navigation',
  'faqs',
  'testimonials',
  'portfolio',
  'media',
];
export async function listResource(resource: string) {
  switch (resource) {
    case 'products':
      return db.product.findMany({
        include: { images: true, collections: true, attributes: true },
        orderBy: { position: 'asc' },
      });
    case 'packages':
      return db.giftPackage.findMany({
        include: { images: true, items: true },
        orderBy: { position: 'asc' },
      });
    case 'categories':
      return db.category.findMany({ orderBy: { position: 'asc' } });
    case 'collections':
      return db.collection.findMany({ orderBy: { position: 'asc' } });
    case 'pages':
      return db.page.findMany();
    case 'sections':
      return db.section.findMany({ include: { page: true }, orderBy: { position: 'asc' } });
    case 'navigation':
      return db.navigationItem.findMany({ orderBy: { position: 'asc' } });
    case 'faqs':
      return db.fAQ.findMany({ orderBy: { position: 'asc' } });
    case 'testimonials':
      return db.testimonial.findMany({ orderBy: { position: 'asc' } });
    case 'portfolio':
      return db.portfolio.findMany({ orderBy: { position: 'asc' } });
    case 'media':
      return db.mediaAsset.findMany({ orderBy: { createdAt: 'desc' } });
    case 'leads':
      throw new Error('Use the authorized Supabase enquiry endpoint');
    case 'settings':
      return db.siteSettings.findMany();
    case 'users':
      return db.adminUser.findMany({
        select: { id: true, name: true, email: true, role: true, active: true },
      });
    default:
      throw new Error('Unknown resource');
  }
}
export async function saveResource(
  resource: string,
  input: unknown,
  id: string | undefined,
  userId: string,
) {
  return db.$transaction(async (tx) => {
    let record: { id: string };
    if (resource === 'products') {
      const { mediaIds, collectionIds, attributes, ...data } = v.productSchema.parse(input);
      if (data.productType === 'combo' && data.includedProducts.length === 0)
        throw new Error('A combo requires contents.');
      if (data.productType === 'individual' && data.includedProducts.length > 0)
        throw new Error('Only combos can have contents.');
      for (const component of data.includedProducts) {
        if (
          component.productId &&
          !(await tx.product.findFirst({
            where: { id: component.productId, productType: 'individual', status: 'PUBLISHED' },
          }))
        )
          throw new Error('Select a published individual component.');
      }
      const old = id ? await tx.product.findUniqueOrThrow({ where: { id } }) : null;
      const nested = {
        ...data,
        images: { create: mediaIds.map((mediaId, position) => ({ mediaId, position })) },
        collections: { create: collectionIds.map((collectionId) => ({ collectionId })) },
        attributes: { create: attributes },
      };
      if (id) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        await tx.productCollection.deleteMany({ where: { productId: id } });
        await tx.productAttribute.deleteMany({ where: { productId: id } });
        record = await tx.product.update({ where: { id }, data: nested });
      } else record = await tx.product.create({ data: nested });
      if (old && old.slug !== data.slug) {
        await tx.redirect.deleteMany({ where: { from: '/products/' + data.slug } });
        await tx.redirect.updateMany({
          where: { to: '/products/' + old.slug },
          data: { to: '/products/' + data.slug },
        });
        await tx.redirect.upsert({
          where: { from: '/products/' + old.slug },
          update: { to: '/products/' + data.slug },
          create: { from: '/products/' + old.slug, to: '/products/' + data.slug },
        });
      }
    } else if (resource === 'packages') {
      const { mediaIds, items, ...data } = v.packageSchema.parse(input);
      const old = id ? await tx.giftPackage.findUniqueOrThrow({ where: { id } }) : null;
      if (id) {
        await tx.packageImage.deleteMany({ where: { packageId: id } });
        await tx.packageItem.deleteMany({ where: { packageId: id } });
      }
      const nested = {
        ...data,
        images: { create: mediaIds.map((mediaId, position) => ({ mediaId, position })) },
        items: { create: items },
      };
      record = id
        ? await tx.giftPackage.update({ where: { id }, data: nested })
        : await tx.giftPackage.create({ data: nested });
      if (old && old.slug !== data.slug) {
        await tx.redirect.deleteMany({ where: { from: '/packages/' + data.slug } });
        await tx.redirect.updateMany({
          where: { to: '/packages/' + old.slug },
          data: { to: '/packages/' + data.slug },
        });
        await tx.redirect.upsert({
          where: { from: '/packages/' + old.slug },
          update: { to: '/packages/' + data.slug },
          create: { from: '/packages/' + old.slug, to: '/packages/' + data.slug },
        });
      }
    } else if (resource === 'categories') {
      const data = v.categorySchema.parse(input);
      record = id
        ? await tx.category.update({ where: { id }, data })
        : await tx.category.create({ data });
    } else if (resource === 'collections') {
      const data = v.collectionSchema.parse(input);
      record = id
        ? await tx.collection.update({ where: { id }, data })
        : await tx.collection.create({ data });
    } else if (resource === 'pages') {
      const data = v.pageSchema.parse(input);
      record = id ? await tx.page.update({ where: { id }, data }) : await tx.page.create({ data });
    } else if (resource === 'sections') {
      const { publish, draft, ...data } = v.sectionSchema.parse(input);
      const payload = {
        ...data,
        draft: draft as Prisma.InputJsonValue,
        ...(publish ? { published: draft as Prisma.InputJsonValue } : {}),
      };
      record = id
        ? await tx.section.update({ where: { id }, data: payload })
        : await tx.section.create({ data: payload });
    } else if (resource === 'navigation') {
      const data = v.navSchema.parse(input);
      record = id
        ? await tx.navigationItem.update({ where: { id }, data })
        : await tx.navigationItem.create({ data });
    } else if (resource === 'faqs') {
      const data = v.faqSchema.parse(input);
      record = id ? await tx.fAQ.update({ where: { id }, data }) : await tx.fAQ.create({ data });
    } else if (resource === 'testimonials') {
      const data = v.testimonialSchema.parse(input);
      record = id
        ? await tx.testimonial.update({ where: { id }, data })
        : await tx.testimonial.create({ data });
    } else if (resource === 'portfolio') {
      const data = v.portfolioSchema.parse(input);
      record = id
        ? await tx.portfolio.update({ where: { id }, data })
        : await tx.portfolio.create({ data });
    } else if (resource === 'settings') {
      const data = v.settingsSchema.parse(input);
      record = await tx.siteSettings.upsert({
        where: { id: 'global' },
        update: { data },
        create: { id: 'global', data },
      });
    } else throw new Error('Unsupported resource');
    await tx.auditLog.create({
      data: { userId, action: id ? 'UPDATE' : 'CREATE', entity: resource, entityId: record.id },
    });
    return record;
  });
}
