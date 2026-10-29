import { z } from 'zod';
export const safeUrl = z
  .string()
  .max(2000)
  .refine(
    (v) => v === '' || /^\/(?!\/)/.test(v) || /^https:\/\//.test(v),
    'Use a relative path or HTTPS URL',
  );
const text = z.string().trim().max(500);
const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(150);
const status = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
const list = z.array(z.string().trim().min(1).max(200)).max(100);
const price = z.number().min(0).max(1000000000).nullable().optional();
export const includedProductSchema = z.object({
  productId: z.string().nullable().optional(),
  displayName: text.min(1),
  quantity: z.number().int().min(1).max(10000),
  image: safeUrl,
  description: text,
});
export const productSchema = z.object({
  name: text.min(2),
  slug,
  sku: text.min(1),
  productType: z.enum(['individual', 'combo']).default('individual'),
  variants: list.default([]),
  customisationOptions: list.default([]),
  enquiryEnabled: z.boolean().default(true),
  includedProducts: z.array(includedProductSchema).max(30).default([]),
  packagingDetails: z.string().max(3000).default(''),
  description: z.string().max(20000),
  shortDescription: text.default(''),
  categoryId: z.string().nullable().optional(),
  tags: list.default([]),
  colors: list.default([]),
  materials: list.default([]),
  branding: list.default([]),
  packaging: list.default([]),
  dimensions: text.default(''),
  minimumOrder: z.number().int().positive().nullable().optional(),
  price,
  showPrice: z.boolean().default(false),
  featured: z.boolean().default(false),
  position: z.number().int().min(0).default(0),
  status: status.default('DRAFT'),
  seoTitle: text.nullable().optional(),
  seoDescription: text.nullable().optional(),
  mediaIds: list.default([]),
  collectionIds: list.default([]),
  attributes: z
    .array(z.object({ label: text.min(1), value: text }))
    .max(100)
    .default([]),
});
export const packageSchema = z.object({
  name: text.min(2),
  slug,
  description: z.string().max(20000),
  specifications: z.string().max(10000).default(''),
  status: status.default('DRAFT'),
  featured: z.boolean().default(false),
  position: z.number().int().min(0).default(0),
  price,
  showPrice: z.boolean().default(false),
  seoTitle: text.nullable().optional(),
  seoDescription: text.nullable().optional(),
  mediaIds: list.default([]),
  items: z
    .array(z.object({ productId: z.string().min(1), quantity: z.number().int().min(1).max(10000) }))
    .max(100)
    .default([]),
});
export const categorySchema = z.object({
  name: text.min(2),
  slug,
  description: z.string().max(3000).default(''),
  status,
  position: z.number().int().min(0).default(0),
  imageId: z.string().nullable().optional(),
});
export const collectionSchema = categorySchema.omit({ imageId: true });
export const settingsSchema = z.object({
  companyName: text.min(1),
  logo: safeUrl.default(''),
  favicon: safeUrl.default(''),
  phone: text.default(''),
  email: z.union([z.literal(''), z.string().email()]).default(''),
  whatsapp: z
    .string()
    .regex(/^\d{8,15}$|^$/)
    .default(''),
  address: text.default(''),
  announcement: text.default(''),
  cta: text.min(1),
  footerText: text.default(''),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  seoTitle: text,
  seoDescription: text,
  notificationEmail: z.union([z.literal(''), z.string().email()]).default(''),
  gaId: z
    .string()
    .regex(/^G-[A-Z0-9]+$|^$/)
    .default(''),
  gtmId: z
    .string()
    .regex(/^GTM-[A-Z0-9]+$|^$/)
    .default(''),
  socials: z.array(z.object({ label: text, url: safeUrl })).default([]),
});
export const sectionContentSchema = z.object({
  eyebrow: text.default(''),
  title: text,
  subtitle: text.default(''),
  caption: text.default(''),
  formDescription: text.default(''),
  description: z.string().max(10000).default(''),
  imageUrl: safeUrl.default(''),
  imageAlt: text.default(''),
  ctaLabel: text.default(''),
  cards: z
    .array(
      z.object({
        title: text,
        description: z.string().max(2000),
        imageUrl: safeUrl.default(''),
        href: safeUrl.default(''),
      }),
    )
    .max(30)
    .default([]),
});
export const sectionSchema = z.object({
  pageId: z.string(),
  kind: z.enum([
    'hero',
    'benefits',
    'services',
    'portfolio',
    'cta',
    'text',
    'catalog',
    'faq',
    'reviews',
    'trust',
  ]),
  position: z.number().int().min(0),
  draft: sectionContentSchema,
  publish: z.boolean().default(false),
});
export const pageSchema = z.object({
  slug,
  title: text,
  status,
  seoTitle: text.nullable().optional(),
  seoDescription: text.nullable().optional(),
});
export const navSchema = z.object({
  label: text.min(1),
  href: safeUrl,
  location: z.enum(['header', 'footer']),
  parentId: z.string().nullable().optional(),
  position: z.number().int().min(0),
});
export const faqSchema = z.object({
  question: text.min(1),
  answer: z.string().max(5000),
  status,
  position: z.number().int().min(0),
});
export const testimonialSchema = z
  .object({
    name: text,
    company: text,
    quote: z.string().max(3000),
    verified: z.boolean(),
    status,
    position: z.number().int().min(0),
  })
  .refine(
    (v) => v.status !== 'PUBLISHED' || v.verified,
    'Verify permission and authenticity before publishing',
  );
export const portfolioSchema = z
  .object({
    title: text,
    description: z.string().max(3000),
    imageUrl: safeUrl,
    verified: z.boolean(),
    status,
    position: z.number().int().min(0),
  })
  .refine((v) => v.status !== 'PUBLISHED' || v.verified, 'Verify work before publishing');
export const leadSchema = z
  .object({
    requestId: z.string().uuid(),
    name: text.max(250).min(2, 'Please enter your full name'),
    company: text.max(250).min(2, 'Please enter your company name'),
    email: z.string().email('Please enter a valid email address').max(254),
    phone: z
      .string()
      .regex(/^[+\d ()-]{8,20}$/, 'Please enter a valid phone number')
      .refine((v) => /^\d{8,15}$/.test(v.replace(/\D/g, '')), 'Enter a valid phone number'),
    quantity: z
      .number({ invalid_type_error: 'Please enter the number of gifts' })
      .int('Please enter a whole number')
      .min(1, 'Please enter at least one gift')
      .max(10000000),
    city: text.max(250).optional(),
    budget: text.max(250).optional(),
    occasion: text.max(250).optional(),
    message: z.string().max(5000).optional(),
    customisationRequirements: z.string().max(2000).optional(),
    packagingPreferences: z.string().max(2000).optional(),
    consent: z.literal(true),
    source: z.string().max(2000).regex(/^\/(?!\/)/, 'Invalid source page'),
    utm: z
      .record(z.string().max(500))
      .refine((v) =>
        Object.keys(v).every((k) =>
          ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].includes(k),
        ),
      ),
    comboName: text.optional(),
    selectedOccasion: text.max(250).optional(),
    productId: z.string().max(250).optional(),
    packageId: z.string().max(250).optional(),
    website: z.string().max(0).default(''),
  })
  .refine((v) => !(v.productId && v.packageId), 'Select one enquiry context');
export const leadUpdateSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'QUOTE_SENT', 'CONVERTED', 'CLOSED', 'SPAM']),
  note: z.string().trim().max(5000).optional(),
});
export function csvCell(value: unknown) {
  return (
    '"' +
    String(value ?? '')
      .replace(/^[=+\-@\t\r]/, "'$&")
      .replace(/"/g, '""') +
    '"'
  );
}
