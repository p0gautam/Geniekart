import { cache } from 'react';
import { db } from './db';
import { settingsSchema, sectionContentSchema } from './validation';
export const defaults = {
  companyName: 'Geniekart',
  logo: '',
  favicon: '',
  phone: '+91 79766 82043',
  email: '',
  whatsapp: '917976682043',
  address: '12, Nandpuri Rd, behind Mangal Manch, Hawa Sadak, Sharma Colony, Bais Godam, Jaipur, Rajasthan 302019',
  announcement: 'Pan-India Express Delivery | Dispatched in 48 Hours | Trusted Courier Partners: Blue Dart, Delhivery',
  cta: 'Enquire Now',
  footerText: 'Thoughtfully curated gifts for your people and your business.',
  primaryColor: '#B92B27',
  seoTitle: 'Geniekart | Corporate Gifting',
  seoDescription:
    'Explore corporate gifts, welcome kits and festive hampers. Request a customized bulk gifting quote.',
  notificationEmail: '',
  gaId: '',
  gtmId: '',
  socials: [
    { label: 'Instagram', url: 'https://www.instagram.com/geniekart_official/' },
    { label: 'Facebook', url: 'https://www.facebook.com/p/Geniekart-61577174264088/' },
  ],
};
export const settings = cache(async () => {
  const record = await db.siteSettings.findUnique({ where: { id: 'global' } });
  const saved = settingsSchema.parse(record?.data ?? defaults);
  return {
    ...saved,
    phone: saved.phone || defaults.phone,
    whatsapp: saved.whatsapp || defaults.whatsapp,
    address: saved.address || defaults.address,
    socials: saved.socials.length ? saved.socials : defaults.socials,
    announcement:
      saved.announcement === 'Thoughtful corporate gifts • Custom branding • Enquire for delivery options'
        ? defaults.announcement
        : saved.announcement,
  };
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
  return `https://wa.me/${number}?text=${encodeURIComponent(`Hello, I'm interested in bulk corporate gifting${name ? ' for ' + name : ''}. Please share the Geniekart catalog and customization details.`)}`;
}
