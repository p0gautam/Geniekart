import { cache } from 'react';
import { db } from './db';
import { settingsSchema, sectionContentSchema } from './validation';
export const defaults = {
  companyName: 'Geniekart',
  logo: '',
  favicon: '',
  phone: '',
  email: '',
  whatsapp: '',
  address: '',
  announcement: 'Thoughtful corporate gifts • Custom branding • Enquire for delivery options',
  cta: 'Enquire Now',
  footerText: 'Thoughtfully curated gifts for your people and your business.',
  primaryColor: '#B92B27',
  seoTitle: 'Geniekart | Corporate Gifting',
  seoDescription:
    'Explore corporate gifts, welcome kits and festive hampers. Request a customized bulk gifting quote.',
  notificationEmail: '',
  gaId: '',
  gtmId: '',
  socials: [],
};
export const settings = cache(async () => {
  const record = await db.siteSettings.findUnique({ where: { id: 'global' } });
  return settingsSchema.parse(record?.data ?? defaults);
});
export const productInclude = {
  images: { include: { media: true }, orderBy: { position: 'asc' as const } },
  category: true,
  attributes: true,
  collections: { include: { collection: true } },
};
export async function pageSections(slug: string, preview = false) {
  const page = await db.page.findUnique({
    where: { slug },
    include: { sections: { orderBy: { position: 'asc' } } },
  });
  if (!page || (!preview && page.status !== 'PUBLISHED')) return [];
  return page.sections.flatMap((s) => {
    const data = preview ? s.draft : s.published;
    if (!data) return [];
    return [{ ...s, content: sectionContentSchema.parse(data) }];
  });
}
export function whatsappUrl(number: string, name?: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent(`Hello, I'm interested in bulk corporate gifting${name ? ' for ' + name : ''}. Please share customization and quotation details.`)}`;
}
