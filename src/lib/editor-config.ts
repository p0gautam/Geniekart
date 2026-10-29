export type Field = {
  key: string;
  label: string;
  type?:
    | 'text'
    | 'textarea'
    | 'number'
    | 'checkbox'
    | 'select'
    | 'list'
    | 'media'
    | 'multi'
    | 'repeater';
  options?: string[];
  source?: string;
  fields?: Field[];
  required?: boolean;
};
const f = (
  key: string,
  label: string,
  type: Field['type'] = 'text',
  extra: Partial<Field> = {},
): Field => ({ key, label, type, ...extra });
const status = f('status', 'Publishing status', 'select', {
  options: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
});
const position = f('position', 'Display order', 'number');
const seo = [f('seoTitle', 'SEO title'), f('seoDescription', 'SEO description', 'textarea')];
const identity = [
  f('name', 'Name', 'text', { required: true }),
  f('slug', 'URL slug', 'text', { required: true }),
];
const media = f('mediaIds', 'Gallery images (in selected order)', 'media');
export const sectionFields: Field[] = [
  f('eyebrow', 'Eyebrow'),
  f('title', 'Heading'),
  f('subtitle', 'Subheading / hero italic line'),
  f('caption', 'Image caption'),
  f('formDescription', 'Form introduction'),
  f('description', 'Description', 'textarea'),
  f('imageUrl', 'Image URL'),
  f('imageAlt', 'Image alt text'),
  f('ctaLabel', 'CTA label'),
  f('cards', 'Cards', 'repeater', {
    fields: [
      f('title', 'Title'),
      f('description', 'Description', 'textarea'),
      f('imageUrl', 'Image URL'),
      f('href', 'Link'),
    ],
  }),
];
export const configs: Record<string, Field[]> = {
  products: [
    ...identity,
    f('sku', 'SKU', 'text', { required: true }),
    f('productType', 'Product type', 'select', { options: ['individual', 'combo'] }),
    f('variants', 'Confirmed variants (comma separated)', 'list'),
    f('customisationOptions', 'Enquiry preferences (comma separated)', 'list'),
    f('enquiryEnabled', 'Enable enquiries', 'checkbox'),
    f('packagingDetails', 'Packaging details', 'textarea'),
    f('includedProducts', 'Combo contents (not extra catalogue listings)', 'repeater', {
      fields: [
        f('productId', 'Matching product (optional)', 'select', { source: 'products' }),
        f('displayName', 'Display name'),
        f('quantity', 'Quantity', 'number'),
        f('image', 'Image URL'),
        f('description', 'Short description', 'textarea'),
      ],
    }),
    f('shortDescription', 'Short description', 'textarea'),
    f('description', 'Full description', 'textarea'),
    f('categoryId', 'Category', 'select', { source: 'categories' }),
    f('collectionIds', 'Collections', 'multi', { source: 'collections' }),
    media,
    f('attributes', 'Specifications', 'repeater', {
      fields: [f('label', 'Specification'), f('value', 'Value')],
    }),
    ...['tags', 'colors', 'materials', 'branding', 'packaging'].map((k) =>
      f(k, k[0].toUpperCase() + k.slice(1) + ' (comma separated)', 'list'),
    ),
    f('dimensions', 'Dimensions'),
    f('minimumOrder', 'Minimum quantity', 'number'),
    f('price', 'Indicative price (INR)', 'number'),
    f('showPrice', 'Show indicative price', 'checkbox'),
    f('featured', 'Featured on homepage', 'checkbox'),
    position,
    status,
    ...seo,
  ],
  packages: [
    ...identity,
    f('description', 'Description', 'textarea'),
    f('specifications', 'Specifications', 'textarea'),
    f('items', 'Products in package', 'repeater', {
      fields: [
        f('productId', 'Product', 'select', { source: 'products' }),
        f('quantity', 'Quantity', 'number'),
      ],
    }),
    media,
    f('price', 'Indicative price (INR)', 'number'),
    f('showPrice', 'Show indicative price', 'checkbox'),
    f('featured', 'Featured on homepage', 'checkbox'),
    position,
    status,
    ...seo,
  ],
  categories: [
    ...identity,
    f('description', 'Description', 'textarea'),
    f('imageId', 'Category image', 'select', { source: 'media' }),
    position,
    status,
  ],
  collections: [...identity, f('description', 'Description', 'textarea'), position, status],
  pages: [f('title', 'Page title'), f('slug', 'Page slug'), status, ...seo],
  sections: [
    f('pageId', 'Page', 'select', { source: 'pages' }),
    f('kind', 'Section type', 'select', {
      options: [
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
      ],
    }),
    position,
  ],
  navigation: [
    f('label', 'Label'),
    f('href', 'Destination URL'),
    f('location', 'Location', 'select', { options: ['header', 'footer'] }),
    f('parentId', 'Parent navigation item', 'select', { source: 'navigation' }),
    position,
  ],
  faqs: [f('question', 'Question'), f('answer', 'Answer', 'textarea'), position, status],
  testimonials: [
    f('name', 'Contact name'),
    f('company', 'Company'),
    f('quote', 'Review', 'textarea'),
    f('verified', 'Verified authentic and approved for publication', 'checkbox'),
    position,
    status,
  ],
  portfolio: [
    f('title', 'Project title'),
    f('description', 'Description', 'textarea'),
    f('imageUrl', 'Image URL'),
    f('verified', 'Verified genuine work and approved for publication', 'checkbox'),
    position,
    status,
  ],
  settings: [
    f('companyName', 'Company name'),
    f('logo', 'Logo URL'),
    f('favicon', 'Favicon URL'),
    f('phone', 'Phone'),
    f('email', 'Contact email'),
    f('whatsapp', 'WhatsApp number (country code and digits only)'),
    f('address', 'Address', 'textarea'),
    f('announcement', 'Announcement'),
    f('cta', 'Global CTA label'),
    f('footerText', 'Footer description', 'textarea'),
    f('primaryColor', 'Brand red (hex)'),
    ...seo,
    f('notificationEmail', 'Lead notification email'),
    f('gaId', 'GA4 measurement ID'),
    f('gtmId', 'GTM container ID'),
    f('socials', 'Social profiles', 'repeater', {
      fields: [f('label', 'Label'), f('url', 'HTTPS URL')],
    }),
  ],
};
